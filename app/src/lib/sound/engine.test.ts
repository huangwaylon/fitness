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
  /** The ramps scheduled (value, time): the fake jumps to each at once. */
  ramps: [number, number][] = [];
  linearRampToValueAtTime(v: number, t: number) {
    this.ramps.push([v, t]);
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
  to: unknown[] = [];
  connect<T>(n: T): T {
    this.connected++;
    this.to.push(n);
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
  at: number | null = null;
  start(at = 0) {
    this.at = at;
  }
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
  gains: FakeNode[] = [];
  createGain() {
    const g = new FakeNode();
    this.gains.push(g);
    return g;
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
  /** A statechange the fake didn't fire itself (a lock's suspend). */
  dispatch() {
    this.#listeners.forEach((f) => f());
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

describe('files fetched ahead (prefetch)', () => {
  it('keeps the last two fetched ahead only, never the track’s or a pin’s; dropAhead lets them go, not the track picked', async () => {
    const { e } = await unlocked();
    void e.setTrack('10', HOUR);
    await settle();
    e.pin(['music/pinned.m4a']);
    await settle();
    const urlOf = new Map<string, string>();
    vi.mocked(URL.createObjectURL).mockClear();
    const songs = ['a', 'b', 'c', 'd', 'e'].map((s) => `kk/${s}.m4a`);
    for (const s of songs) {
      e.prefetch(s);
      await settle();
      urlOf.set(s, vi.mocked(URL.createObjectURL).mock.results.at(-1)!.value as string);
    }
    // the track's and the pin's, asked for ahead: theirs already, nothing fetched
    e.prefetch(HOUR.file);
    e.prefetch('music/pinned.m4a');
    await settle();
    const revoked = () => vi.mocked(URL.revokeObjectURL).mock.calls.map(([u]) => u);
    expect(revoked()).toEqual(['a', 'b', 'c'].map((s) => urlOf.get(`kk/${s}.m4a`)));
    // one asked for again is the newest: the older of the other goes on the next
    e.prefetch('kk/d.m4a');
    e.prefetch('kk/f.m4a');
    await settle();
    urlOf.set('kk/f.m4a', vi.mocked(URL.createObjectURL).mock.results.at(-1)!.value as string);
    expect(revoked()).toContain(urlOf.get('kk/e.m4a'));
    expect(revoked()).not.toContain(urlOf.get('kk/d.m4a'));
    // a song picked (the track's now) stays as the list closes; the other goes
    void e.setTrack('kk/d', { file: 'kk/d.m4a', start: 0 }, false, 'cut');
    e.dropAhead();
    await settle();
    expect(revoked()).toContain(urlOf.get('kk/f.m4a'));
    expect(revoked()).not.toContain(urlOf.get('kk/d.m4a'));
    expect(e.track).toBe('kk/d');
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

describe('a shared stage’s song (`from`: docs/sound-sync.md)', () => {
  const SONG: MusicTrack = { file: 'kk/kk-march.m4a', start: 0 };
  it('starts where the song is now, the offset taken after a slow fetch', async () => {
    const { e, decks } = await unlocked();
    let arrive!: () => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise((ok) => (arrive = () => ok({ ok: true, blob: async () => new Blob(['x']) } as Response))));
    const done = e.setTrack('st/isl/kk-march/1', { ...SONG, from: Date.now() - 30_000 }, false, 'cut');
    await vi.advanceTimersByTimeAsync(2000); // the fetch takes 2 s
    arrive();
    await done;
    expect(decks.find((d) => !d.paused)!.currentTime).toBeCloseTo(32, 1);
  });

  it('the same key again puts a drifted deck back (over 0.3 s), and leaves a close one', async () => {
    const { e, decks } = await unlocked();
    const tr = { ...SONG, from: Date.now() };
    void e.setTrack('st/isl/kk-march/1', tr, false, 'cut');
    await settle();
    const deck = decks.find((d) => !d.paused)!;
    deck.currentTime = 0.8; // ~1 s in: close enough
    void e.setTrack('st/isl/kk-march/1', tr, false, 'cut');
    expect(deck.currentTime).toBe(0.8);
    await vi.advanceTimersByTimeAsync(60_000); // a lock: the element held still
    void e.setTrack('st/isl/kk-march/1', tr, false, 'cut');
    expect(deck.currentTime).toBeCloseTo(61, 1);
  });

  it('a song already over when its file is here ends at once (onended), nothing sounding', async () => {
    const { e, decks } = await unlocked();
    const ended: string[] = [];
    e.onended = (k) => ended.push(k);
    await e.setTrack('st/isl/kk-march/1', { ...SONG, from: Date.now() - 121_000 }, false, 'cut'); // the file: 120 s
    expect(ended).toEqual(['st/isl/kk-march/1']);
    expect(e.track).toBeNull();
    await settle();
    expect(decks.every((d) => d.paused)).toBe(true);
  });
});

describe('lazy effects (ids.ts `lazy`: the radio jingles)', () => {
  const RADIO = (['1', '2', '3', '4', '5'] as const).map((n) => `radio-morning-${n}` as const);
  beforeEach(() => {
    vi.resetModules();
    vi.doMock('./manifest.ts', async (orig) => {
      const m = await orig<typeof import('./manifest.ts')>();
      const sfx = { coin: 'sfx/coin.m4a', fanfare: 'sfx/fanfare.m4a', ...Object.fromEntries(RADIO.map((id) => [id, `sfx/${id}.m4a`])) };
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

  it("a sound with no file of its own plays its `like`'s: the item-get fanfare the fanfare's file, a radio jingle the chime's placeholder", async () => {
    const { e, ctx } = await unlocked();
    await vi.advanceTimersByTimeAsync(1000); // the files and the renderer
    let before = ctx.sources.length;
    e.play('get-fanfare');
    expect((ctx.sources.slice(before).find((s) => s.buffer)?.buffer as AudioBuffer | undefined)?.duration).toBe(1); // the fanfare's file
    ctx.currentTime = 20; // past the fanfare (jingles never overlap)
    before = ctx.sources.length;
    const calls = vi.mocked(fetch).mock.calls.length;
    e.play('radio-noon-6');
    await vi.advanceTimersByTimeAsync(0);
    expect(vi.mocked(fetch).mock.calls.length).toBe(calls); // nothing to fetch
    expect((ctx.sources.slice(before).find((s) => s.buffer)?.buffer as AudioBuffer | undefined)?.duration).toBeGreaterThan(1); // the chime's ~1.7 s placeholder
  });

  it('a file too slow to arrive plays the placeholder at the wait’s end, not nothing (and not the file late)', async () => {
    const { e, ctx } = await unlocked();
    await vi.advanceTimersByTimeAsync(1000); // the files and the renderer
    let arrive!: () => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise((ok) => (arrive = () => ok({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) } as Response))));
    const before = ctx.sources.length;
    e.play('radio-morning-4');
    await vi.advanceTimersByTimeAsync(2000);
    expect(ctx.sources.slice(before).filter((s) => s.buffer)).toHaveLength(0); // still waiting
    await vi.advanceTimersByTimeAsync(600);
    const placeholder = ctx.sources.slice(before).filter((s) => s.buffer);
    expect(placeholder).toHaveLength(1);
    expect((placeholder[0].buffer as AudioBuffer).duration).toBeGreaterThan(1); // the chime's
    arrive();
    await vi.advanceTimersByTimeAsync(0);
    expect(ctx.sources.slice(before).filter((s) => s.buffer)).toHaveLength(1);
  });

  it('nothing is fetched while effects are off (no context, no play)', async () => {
    const { Engine } = await import('./engine.ts');
    new Engine().play('radio-morning-3');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetched('sfx/radio-morning-3.m4a')).toBe(0);
  });
});

describe('the voice bus (ききみみ: engine.ts wakeVoice, holdAwake, loadClip, playClip)', () => {
  const SILENT = { music: false, sfx: false, volume: 0.5 };
  const fetched = (path: string) => vi.mocked(fetch).mock.calls.filter(([u]) => String(u).includes(path)).length;
  const clip = (ctx: FakeContext) => ctx.createBuffer(1, 8000) as unknown as AudioBuffer; // 1 s

  /** A context woken for the voice alone, every sound setting off. */
  async function voiced() {
    const { Engine } = await import('./engine.ts');
    const e = new Engine();
    expect(e.wakeVoice()).toBe(true);
    e.setLevels(SILENT);
    e.holdAwake(true);
    return { e, ctx: FakeContext.last };
  }

  it('wakes the context with nothing else: no decks, no effect files, no renderer', async () => {
    const { ctx } = await voiced();
    await vi.advanceTimersByTimeAsync(1000);
    expect(ctx.state).toBe('running');
    expect(FakeAudio.all).toHaveLength(0);
    expect(vi.mocked(fetch)).not.toHaveBeenCalled();
  });

  it('its level is 音量 alone: the same with 効果音 and ミュージック off or on', async () => {
    const { e, ctx } = await voiced();
    e.playClip(clip(ctx));
    const bus = ctx.sources.at(-1)!.to[0] as FakeNode;
    const master = bus.to[0] as FakeNode;
    expect([bus.gain.value, master.gain.value]).toEqual([1, 0.25]); // 0.5²
    e.setLevels({ music: true, sfx: true, volume: 1 });
    expect([bus.gain.value, master.gain.value]).toEqual([1, 1]);
    e.setLevels({ ...SILENT, volume: 0 });
    expect(master.gain.value).toBe(0);
  });

  it('ducks the music under a clip; stopped early, the music comes back', async () => {
    const { e, ctx } = await voiced();
    ctx.currentTime = 3;
    const c = e.playClip(clip(ctx), { at: 4 })!;
    expect(c.endsAt).toBe(5);
    expect(ctx.sources.at(-1)!.at).toBe(4);
    const lowpass = (n: unknown) => (n as FakeNode).type === 'lowpass';
    // the duck: the gain feeding the low-pass
    const duck = (ctx as unknown as { gains: FakeNode[] }).gains.find((g) => g.to.some(lowpass))!;
    expect(duck.gain.ramps.map(([v]) => v)).toEqual([0.25, 0.25, 1]);
    expect(duck.gain.ramps[1][1]).toBe(5);
    duck.gain.ramps = [];
    c.stop();
    expect(ctx.sources.at(-1)!.stopped).toBe('now');
    expect(duck.gain.ramps.at(-1)![0]).toBe(1);
  });

  it('a clip asked for in the past plays whole from now; none while the context is suspended (a lock)', async () => {
    const { e, ctx } = await voiced();
    ctx.currentTime = 10;
    expect(e.playClip(clip(ctx), { at: 8 })!.endsAt).toBe(11);
    e.pause(); // the background: the playing clip stops, nothing more sounds
    expect(ctx.sources.at(-1)!.stopped).toBe('now');
    await vi.advanceTimersByTimeAsync(1000);
    expect(e.playClip(clip(ctx))).toBeNull();
    e.wakeVoice(); // the card's tap
    expect(e.playClip(clip(ctx))).not.toBeNull();
  });

  it('held awake, neither the idle timer nor everything off suspends it; let go, the idle timer does', async () => {
    const { e, ctx } = await voiced();
    e.playClip(clip(ctx));
    e.sleep(); // apply() with every setting off
    await vi.advanceTimersByTimeAsync(1000);
    e.hush(); // 音量 at 0
    await vi.advanceTimersByTimeAsync(IDLE_SUSPEND_MS * 3);
    expect(ctx.suspends).toBe(0);
    e.holdAwake(false);
    ctx.sources.at(-1)!.onended?.();
    await vi.advanceTimersByTimeAsync(IDLE_SUSPEND_MS + 100);
    expect(ctx.suspends).toBe(1);
  });

  it('keeps 4 decoded, the least recently asked for going first; one asked twice at once is fetched once; a failure isn’t kept', async () => {
    const { e } = await voiced();
    const p = (n: number) => `kikimimi/q${n}.m4a?v=1`;
    const [a, b] = [e.loadClip(p(1)), e.loadClip(p(1))];
    expect(await a).not.toBeNull();
    expect(await b).toBe(await a);
    for (const n of [2, 3, 4]) await e.loadClip(p(n));
    await e.loadClip(p(1)); // the newest again
    await e.loadClip(p(5)); // q2 goes
    await e.loadClip(p(1));
    await e.loadClip(p(2));
    expect([fetched('q1.m4a'), fetched('q2.m4a'), fetched('q5.m4a')]).toEqual([1, 2, 1]);
    vi.mocked(fetch).mockImplementationOnce(async () => ({ ok: false }) as Response);
    expect(await e.loadClip(p(6))).toBeNull();
    expect(await e.loadClip(p(6))).not.toBeNull(); // tried again
    e.clearVoice();
    await e.loadClip(p(6));
    expect(fetched('q6.m4a')).toBe(3);
  });

  it('no context, no clip', async () => {
    const { Engine } = await import('./engine.ts');
    expect(await new Engine().loadClip('kikimimi/q1.m4a?v=1')).toBeNull();
  });
});

describe('voiceSession (sound.svelte.ts)', () => {
  beforeEach(() => vi.resetModules());

  it('inside a tap with sound set silent it still unlocks, at 音量, held awake, the session "playback"; off restores it and sleeps', async () => {
    const session = { type: 'auto' };
    vi.stubGlobal('navigator', { audioSession: session });
    const m = await import('./sound.svelte.ts');
    expect(m.voiceSession(true)).toBe(true);
    const ctx = FakeContext.last;
    expect([ctx.state, session.type, m.voice.on, m.voice.state]).toEqual(['running', 'playback', true, 'running']);
    const buf = ctx.createBuffer(1, 8000) as unknown as AudioBuffer;
    ctx.currentTime = 10;
    const c = m.playVoice(buf, { relayAt: 7000, now: () => 5000 })!; // 2 s ahead on the relay's clock
    expect(c.endsAt).toBe(13);
    const master = (ctx.sources.at(-1)!.to[0] as FakeNode).to[0] as FakeNode;
    expect(master.gain.value).toBeCloseTo(0.64); // the default 音量 0.8, squared
    await vi.advanceTimersByTimeAsync(IDLE_SUSPEND_MS * 2);
    expect(ctx.suspends).toBe(0);
    m.voiceSession(true); // again (はじめる after さんか): the type it restores stays the one from before
    m.voiceSession(false);
    expect([session.type, m.voice.on]).toEqual(['ambient', false]); // the engine's own (set as it made the context)
    await vi.advanceTimersByTimeAsync(1000);
    expect(ctx.suspends).toBe(1); // every setting off: it sleeps
    expect(await m.loadVoice('kikimimi/q1.m4a?v=1')).not.toBeNull(); // the context lives on (suspended)
  });

  it('the state follows the context: suspended by a lock, running again after the card’s tap', async () => {
    const m = await import('./sound.svelte.ts');
    m.voiceSession(true);
    const ctx = FakeContext.last;
    await ctx.suspend();
    ctx.dispatch();
    expect(m.voice.state).toBe('suspended');
    m.voiceSession(true);
    await vi.advanceTimersByTimeAsync(400);
    expect(m.voice.state).toBe('running');
  });

  it('without Web Audio or audioSession it says so and throws nothing', async () => {
    vi.stubGlobal('window', {});
    const m = await import('./sound.svelte.ts');
    expect(m.voiceSession(true)).toBe(false);
    expect(m.playVoice({ duration: 1 } as AudioBuffer)).toBeNull();
  });
});
