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
  getAttribute(n: string) {
    return n === 'src' ? this.src || null : null;
  }
  removeAttribute(n: string) {
    if (n === 'src') this.src = '';
  }
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

/** An engine unlocked by a tap with ミュージック on (the context and the two decks), 効果音 on unless `sfx: false`. */
async function unlocked(o: { sfx?: boolean } = {}) {
  const { Engine } = await import('./engine.ts');
  const e = new Engine();
  e.unlock(true);
  e.setLevels({ music: true, sfx: o.sfx ?? true, volume: 1 });
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
    expect(deck.count('error')).toBe(2); // the wait's, and the deck's own (onfailed)
    deck.fire('loadedmetadata');
    await done;
    expect([deck.count('loadedmetadata'), deck.count('error')]).toEqual([0, 1]);
  });
});

describe('a track that can’t play (onfailed)', () => {
  it('a one-shot whose file can’t be fetched reports it (a cut-in would otherwise never end)', async () => {
    const { e } = await unlocked();
    const failed: string[] = [];
    e.onfailed = (k) => failed.push(k);
    vi.mocked(fetch).mockImplementationOnce(async () => ({ ok: false }) as Response);
    await e.setTrack('kk/live/kk-march', { file: 'kk/kk-march.m4a', start: 0 }, false, 'cut');
    expect(failed).toEqual(['kk/live/kk-march']);
  });
  it('an undecodable file reports it from its deck, and stops there', async () => {
    const { e, decks } = await unlocked();
    for (const a of decks) a.readyState = 0;
    const failed: string[] = [];
    e.onfailed = (k) => failed.push(k);
    const done = e.setTrack('opening', OPENING, false);
    await vi.advanceTimersByTimeAsync(0);
    const deck = decks.find((d) => d.count('loadedmetadata') > 0)!;
    deck.fire('error');
    await done;
    expect(failed).toEqual(['opening']);
    // a deck that isn't the one meant to sound (a faded-out one, its blob let go) says nothing
    decks.find((d) => d !== deck)!.fire('error');
    expect(failed).toEqual(['opening']);
  });
  it('a slow fetch never lets the idle timer put the context to sleep under the track it waits for', async () => {
    const { e, ctx } = await unlocked();
    let arrive!: () => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise((ok) => (arrive = () => ok({ ok: true, blob: async () => new Blob(['x']) } as Response))));
    const done = e.setTrack('event/bee-chase', HOUR, true, 'cut');
    await vi.advanceTimersByTimeAsync(IDLE_SUSPEND_MS * 2);
    expect(ctx.suspends).toBe(0);
    arrive();
    await done;
    await settle();
    expect([ctx.state, e.track]).toEqual(['running', 'event/bee-chase']);
  });
});

describe('release (ミュージック off)', () => {
  it('after the fade the files and their URLs go and the decks let go of their media; a track started meanwhile keeps them', async () => {
    const { e, decks } = await unlocked();
    void e.setTrack('10', HOUR);
    await settle();
    e.stopMusic();
    e.release();
    void e.setTrack('10', HOUR); // back on at once
    await vi.advanceTimersByTimeAsync(2000);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    e.stopMusic();
    e.release();
    await vi.advanceTimersByTimeAsync(2000);
    expect(URL.revokeObjectURL).toHaveBeenCalled();
    expect(decks.every((d) => !d.src)).toBe(true);
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

describe('an outside ⏸ holds until a tap', () => {
  it('a cue that wakes the sleeping context, or coming back to the app, doesn’t bring the music back; a tap or ▶ does', async () => {
    const { e, ctx, decks } = await unlocked();
    e.onrunning = () => void e.setTrack('10', HOUR); // as sound.svelte.ts does (syncMusic)
    void e.setTrack('10', HOUR);
    await settle();
    const deck = decks.find((d) => !d.paused)!;
    e.holdMusic();
    await vi.advanceTimersByTimeAsync(IDLE_SUSPEND_MS + 500);
    expect(ctx.state).toBe('suspended');
    e.play('confirm'); // a world sound after a background sync, no tap: wakes the context
    await settle();
    expect(ctx.state).toBe('running');
    expect(deck.paused).toBe(true);
    void e.setTrack('10', HOUR); // back in front (syncMusic)
    await settle();
    expect(deck.paused).toBe(true);
    e.unlock(true); // a tap
    void e.setTrack('10', HOUR);
    await settle();
    expect(deck.paused).toBe(false);
    e.holdMusic();
    await settle();
    e.unhold(); // the lock screen's ▶, in front
    void e.setTrack('10', HOUR);
    await settle();
    expect(deck.paused).toBe(false);
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
  it('a bed without a file is the procedural one, rendered when idle, looping; a variant is a layer of its own', async () => {
    await import('./ambientSynth.ts'); // the chunk is here (the engine imports it on first use)
    const { e, ctx } = await unlocked();
    const n = ctx.sources.length;
    const p = e.setAmbient([{ id: 'crickets', gain: 0.35 }]);
    await vi.advanceTimersByTimeAsync(100);
    await p;
    expect(ctx.sources.slice(n).find((s) => s.loop)?.buffer).toBeTruthy();
    const p2 = e.setAmbient([{ id: 'crickets', gain: 0.35 }, { id: 'birds', gain: 0.3, v: 'autumn' }]);
    await vi.advanceTimersByTimeAsync(100);
    await p2;
    const loops = ctx.sources.slice(n).filter((s) => s.loop);
    expect(loops).toHaveLength(2);
    e.pause();
    expect(loops.every((s) => s.stopped === 'now')).toBe(true);
  });
});

describe('a room’s music (places.ts)', () => {
  it('crossfades in over the hour’s and back out; the hour’s file stays while pinned, the room’s is let go', async () => {
    const { e, decks } = await unlocked();
    const ROOM: MusicTrack = { file: 'places/shop.m4a', start: 0 };
    void e.setTrack('sunny/10', HOUR);
    await settle();
    const hourDeck = decks.find((d) => !d.paused)!;
    const hourSrc = hourDeck.src;
    e.pin([HOUR.file]); // indoors: the island's track kept (sound.svelte.ts syncMusic)
    void e.setTrack('place/shop', ROOM);
    await settle();
    const roomDeck = decks.find((d) => d !== hourDeck)!;
    expect([e.track, roomDeck.paused]).toEqual(['place/shop', false]);
    const roomSrc = roomDeck.src;
    await vi.advanceTimersByTimeAsync(4000);
    expect(hourDeck.paused).toBe(true); // faded out, then paused
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    const fetches = vi.mocked(fetch).mock.calls.length;
    e.pin([]);
    void e.setTrack('sunny/10', HOUR); // out of the door
    await settle();
    expect(vi.mocked(fetch).mock.calls.length).toBe(fetches); // from memory: no wait on the network
    expect([e.track, hourDeck.src, hourDeck.paused]).toEqual(['sunny/10', hourSrc, false]);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(roomSrc);
  });
});

describe('lazy effects (ids.ts `lazy`: the radio jingles)', () => {
  const RADIO = (['1', '2', '3', '4', '5'] as const).map((n) => `radio-morning-${n}` as const);
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('./manifest.ts', async (orig) => {
      const m = await orig<typeof import('./manifest.ts')>();
      const sfx = { coin: 'sfx/coin.m4a', 'island-broadcast': 'sfx/broadcast.m4a', ...Object.fromEntries(RADIO.map((id) => [id, `sfx/${id}.m4a`])) };
      return { ...m, audioUrl: (p: string) => `/audio/${p}`, AUDIO: { ...m.AUDIO, sfx } };
    });
  });
  afterEach(() => {
    vi.doUnmock('./manifest.ts');
    vi.resetModules();
  });
  const fetched = (path: string) => vi.mocked(fetch).mock.calls.filter(([u]) => u === `/audio/${path}`).length;

  it('the unlock decodes the others, not the lazy ones; a first play fetches its file and plays it', async () => {
    const { e, ctx } = await unlocked();
    expect(fetched('sfx/coin.m4a')).toBe(1);
    for (const id of RADIO) expect(fetched(`sfx/${id}.m4a`)).toBe(0);
    const before = ctx.sources.length;
    e.play('radio-morning-1');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetched('sfx/radio-morning-1.m4a')).toBe(1);
    const src = ctx.sources.slice(before).find((s) => s.buffer);
    expect((src?.buffer as AudioBuffer | undefined)?.duration).toBe(1); // the decoded file (the fake's 1 s)
  });

  it('keeps two decoded at most, the least recently played going first', async () => {
    const { e } = await unlocked();
    for (const id of RADIO.slice(0, 3)) {
      e.play(id);
      await vi.advanceTimersByTimeAsync(20_000); // past the jingle (one at a time)
    }
    e.play('radio-morning-3');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetched('sfx/radio-morning-3.m4a')).toBe(1); // still here
    e.play('radio-morning-1');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetched('sfx/radio-morning-1.m4a')).toBe(2); // let go, fetched again
  });

  it('with 効果音 off the unlock fetches no effect file; turning it on does', async () => {
    const { e } = await unlocked({ sfx: false });
    expect(fetched('sfx/coin.m4a')).toBe(0);
    e.setLevels({ music: true, sfx: true, volume: 1 });
    await vi.advanceTimersByTimeAsync(0);
    expect(fetched('sfx/coin.m4a')).toBe(1);
  });

  it("a file that can't be had plays the placeholder (the chime's), and isn't asked for again at once", async () => {
    const { e, ctx } = await unlocked();
    vi.mocked(fetch).mockImplementation(async () => ({ ok: false }) as Response);
    await vi.advanceTimersByTimeAsync(1000); // the renderer chunk
    const before = ctx.sources.length;
    e.play('radio-morning-2');
    await vi.advanceTimersByTimeAsync(0);
    const src = ctx.sources.slice(before).find((s) => s.buffer);
    expect((src?.buffer as AudioBuffer | undefined)?.duration).toBeGreaterThan(1); // the chime's ~1.7 s placeholder
    await vi.advanceTimersByTimeAsync(20_000);
    e.play('radio-morning-2');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetched('sfx/radio-morning-2.m4a')).toBe(1);
  });

  it("a jingle with no file of its own plays its `like`'s (the radio's: the broadcast's file)", async () => {
    const { e } = await unlocked();
    e.play('radio-noon-6');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetched('sfx/broadcast.m4a')).toBe(1);
  });

  it('nothing is fetched while effects are off (no context, no play)', async () => {
    const { Engine } = await import('./engine.ts');
    new Engine().play('radio-morning-3');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetched('sfx/radio-morning-3.m4a')).toBe(0);
  });
});
