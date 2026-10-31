// The Web Audio engine (docs/design.md#engine-lifecycle). Browser only; the pure rules it follows live in mix.ts,
// hourly.ts, ambient.ts and session.ts (tested there). One AudioContext, created inside the first tap after a sound
// setting is on (iOS only starts audio from a gesture), never while everything is off.
//
//   effects  AudioBufferSource → gain ──→ sfx bus ──┐
//                                                  ├→ master (音量) → speakers
//   music    <audio> deck A/B → gain ─┐            │
//   ambience loop sources → ambient ──┴→ duck → muffle (low-pass) → music bus
//
// Music streams from two <audio> elements routed into the graph (decoding a whole 1–2 minute track would cost
// 20–40 MB of PCM on a phone); their levels are gain nodes, because iOS ignores HTMLMediaElement.volume. Each hour is
// one loop period plus a copy of its first seconds (scripts/music.ts): the two decks hand over inside that copy, so
// the loop never relies on `<audio loop>`'s seek at the end. Effects are small decoded buffers.
import { SOUNDS, SOUND_IDS, type Bus, type SoundId } from './ids.ts';
import { LEVELS, VoiceLimiter, duckPlan, jitterRate } from './mix.ts';
import { crossfadePlan, trackLevel, type MusicTrack } from './hourly.ts';
import { AUDIO, audioUrl } from './manifest.ts';
import { IdleTimer, QUEUED_DROP_MS, WRAP, canSound, gestureAction, needsFadeIn, needsUnlock, wrapTarget, type Gesture } from './session.ts';
import type { AmbientId } from './ambient.ts';
import type { SoundSettings } from './settings.ts';

/** The music when muffled (a sheet or the phone is up: NH muffles its BGM under the phone and menus). */
const MUFFLE_HZ = 900;
/** A sound asked for while the renderer is still loading plays if it arrives within this long (the first tap). */
const LATE_MS = 400;

interface Deck {
  el: HTMLAudioElement;
  gain: GainNode;
  /** What it holds (an hour's key, 'opening') while it is the one meant to sound. */
  key: string | null;
  /** Its full level: the track's loudness gain (manifest `gain`, dB) as a factor. */
  level: number;
  /** Where the loop period ends in the file (s) when the file carries a copy of its start for the hand-off. */
  end: number | null;
  /** Chosen and fading in, its play() not called yet: paused, but not stalled. */
  starting: boolean;
  /** The audio-clock time its current fade-in is complete. */
  fadeEnd: number;
  /** Bumped whenever `key` changes: a fade-out's delayed pause() only applies to the assignment it faded out. */
  gen: number;
}

type AudioSessionNav = Navigator & { audioSession?: { type: string } };
type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };
type Synth = typeof import('./synth.ts');

/** A 50 ms silent WAV: played once inside the first tap so iOS lets the music <audio> elements play later. */
function silentWav(): Blob {
  const sr = 8000, n = 400;
  const b = new Uint8Array(44 + n);
  const v = new DataView(b.buffer);
  const s = (o: number, str: string) => [...str].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  s(0, 'RIFF'); v.setUint32(4, 36 + n, true); s(8, 'WAVE'); s(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); s(36, 'data'); v.setUint32(40, n, true);
  b.fill(128, 44); // 8-bit PCM silence
  return new Blob([b], { type: 'audio/wav' });
}

/** Where `navigator.audioSession` exists (WebKit), set its type; elsewhere nothing to do. */
function applySession(type: string): void {
  try {
    const nav = navigator as AudioSessionNav;
    if (nav.audioSession) nav.audioSession.type = type;
  } catch {
    /* not supported */
  }
}

/** Run `f` when the main thread is idle (Safari has no requestIdleCallback: a short timeout instead). */
function whenIdle(f: () => void, ms = 60): void {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(() => f(), { timeout: 2000 });
  else setTimeout(f, ms);
}

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** The first of `events` on `el` (or 'timeout' after `ms`). Every listener it added is removed, so the events that
 *  didn't fire leave nothing behind on a deck that lives for the whole session. */
function firstEvent(el: HTMLMediaElement, events: string[], ms?: number): Promise<string> {
  return new Promise((done) => {
    const ac = new AbortController();
    const timer = ms === undefined ? undefined : setTimeout(() => end('timeout'), ms);
    function end(type: string) {
      ac.abort();
      clearTimeout(timer);
      done(type);
    }
    for (const e of events) el.addEventListener(e, () => end(e), { signal: ac.signal });
  });
}
const clock = () => performance.now();

export class Engine {
  ctx: AudioContext | null = null;
  #master!: GainNode;
  #bus!: Record<Bus | 'ambient', GainNode>;
  #duck!: GainNode;
  #muffle!: BiquadFilterNode;
  #levels: SoundSettings | null = null;
  #synth: Synth | null = null;
  #synthLoad: Promise<void> | null = null;
  #prerendering = false;
  #buffers = new Map<SoundId, AudioBuffer>();
  #files: Promise<void> | null = null;
  #limiter = new VoiceLimiter();
  #live = new Map<number, AudioBufferSourceNode>();
  #decks: Deck[] = [];
  #decksReady = false;
  #silentUrl: string | null = null;
  #front = 0;
  #token = 0;
  /** Music files as blob URLs (path → URL): the current one, and the next hour's once prefetched. */
  #blobs = new Map<string, Promise<string | null>>();
  /** The same, resolved (path → URL): a file already here starts inside the tap that asks for it (setTrack). */
  #urls = new Map<string, string>();
  #ambient = new Map<AmbientId, { src: AudioBufferSourceNode; gain: GainNode }>();
  #ambientBuffers = new Map<AmbientId, Promise<AudioBuffer | null>>();
  #ambientToken = 0;
  /** When the last resume() was asked for (performance.now()): a tap's own cue may sound while it settles. */
  #resumeAt = -Infinity;
  #idle = new IdleTimer(() => this.#onIdle());
  /** Suspended by the idle timer (not by the background or an interruption): the next cue may wake it. */
  #asleep = false;
  #sleepTimer: ReturnType<typeof setTimeout> | undefined;
  #wrapTimer: ReturnType<typeof setTimeout> | undefined;
  #wrapToken = 0;
  #wrapping = false;
  /** Paused from outside (holdMusic): no track sounds again until a tap (unlock) or the Media Session's ▶ (unhold). */
  #held = false;
  /** Called when a one-shot track (the opening) ends. */
  onended: ((key: string) => void) | null = null;
  /** Called when the context starts running again (after an interruption, or iOS resuming it on its own). */
  onrunning: (() => void) | null = null;

  /** The context, created on first use (inside a tap on iOS). Null where Web Audio is missing. */
  #ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!AC) return null;
    // Game music (user): 'ambient' mixes with other apps' audio and follows the Ring/Silent switch. WebKit takes the
    // type when audio first starts, so it's set before the context exists.
    applySession('ambient');
    const ctx = new AC({ latencyHint: 'interactive' });
    const g = () => ctx.createGain();
    this.#master = g();
    this.#master.connect(ctx.destination);
    this.#bus = { music: g(), sfx: g(), ambient: g() };
    for (const b of Object.values(this.#bus)) b.gain.value = 0;
    this.#duck = g();
    this.#muffle = ctx.createBiquadFilter();
    this.#muffle.type = 'lowpass';
    this.#muffle.frequency.value = 20000;
    this.#muffle.Q.value = 0.5;
    this.#bus.sfx.connect(this.#master);
    this.#bus.ambient.connect(this.#duck);
    this.#duck.connect(this.#muffle).connect(this.#bus.music).connect(this.#master);
    ctx.addEventListener('statechange', () => {
      if (ctx.state === 'running') this.onrunning?.();
    });
    this.ctx = ctx;
    return ctx;
  }

  #unlockState(music: boolean) {
    const f = this.#decks[this.#front];
    return { state: this.ctx?.state ?? null, music, decksReady: this.#decksReady, frontStalled: !!f?.key && f.el.paused && !f.starting };
  }

  /** Waiting for a tap (session.ts needsUnlock). */
  needsUnlock(music: boolean): boolean {
    return needsUnlock(this.#unlockState(music));
  }

  /** What this gesture should do (session.ts gestureAction). */
  gesture(g: Gesture, music: boolean): 'none' | 'context' | 'full' {
    return gestureAction(g, this.#unlockState(music));
  }

  /** Call synchronously inside a user gesture (pointerup / touchend / click / keydown). `activation: false` (a
   *  pointerdown, which isn't a user activation on a touch screen) only creates and resumes the context, so the tap's
   *  own sound (fired on pointerdown) can be scheduled; the decks wait for the pointerup. */
  unlock(music: boolean, activation = true): void {
    const ctx = this.#ensure();
    if (!ctx) return;
    this.#held = false;
    clearTimeout(this.#sleepTimer);
    if (ctx.state !== 'running') this.#wake(ctx);
    if (activation) {
      // older iOS: a buffer started inside the tap opens the output
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
      src.connect(ctx.destination);
      src.start();
      if (music) {
        this.#unlockDecks(ctx);
        // a track that should be playing but isn't (the browser refused a play() outside a gesture, or something
        // outside paused it): play() it here, inside the tap, at gain 0; the fade-in that follows (apply →
        // syncMusic → setTrack) brings it up
        const f = this.#decks[this.#front];
        if (f.key && f.el.paused) f.el.play().catch(() => {});
      }
    }
    void this.#loadSynth();
    this.#prerender();
    this.#loadFiles();
    this.#idle.poke();
  }

  #wake(ctx: AudioContext): void {
    this.#asleep = false;
    this.#resumeAt = clock();
    void ctx.resume().catch(() => {});
  }

  /** Load the placeholder renderer ahead of the first tap (it's pure: no context). Called when a setting is on. */
  warm(): void {
    void this.#loadSynth();
  }

  /** Resolves once effects can sound (the placeholder renderer has loaded). Never rejects. */
  whenReady(): Promise<void> {
    return this.#synthLoad ?? Promise.resolve();
  }

  /** The renderer chunk. A stale build's chunk 404s after a deploy: the failure is forgotten, so the next cue or tap
   *  tries again (sound isn't worth reloading the page for; the app's own lazy chunks do that, ui-state/reload.ts). */
  #loadSynth(): Promise<void> {
    return (this.#synthLoad ??= import('./synth.ts').then(
      (m) => {
        this.#synth = m;
        this.#prerender();
      },
      () => {
        this.#synthLoad = null;
      }
    ));
  }

  /** Render the placeholders ahead of their first cue, one per idle slot, jingles first, only for the kinds that are
   *  on (the fanfare and the chime take 25–35 ms each on a Mac, 2–3× that on a phone: never at the cue). */
  #prerender(): void {
    if (this.#prerendering || !this.ctx || !this.#synth) return;
    this.#prerendering = true;
    const first: SoundId[] = ['chime', 'fanfare', 'heart', 'miles'];
    const order = [...first, ...SOUND_IDS.filter((id) => !first.includes(id))];
    const step = () => {
      const ctx = this.ctx;
      const s = this.#levels;
      const id = order.find((i) => !this.#buffers.has(i) && (!s || s.sfx));
      if (!ctx || !id || document.hidden) return void (this.#prerendering = false);
      order.splice(order.indexOf(id), 1);
      this.#buffer(ctx, id);
      whenIdle(step);
    };
    whenIdle(step, 300);
  }

  /** iOS lets an <audio> element play later only if it played once inside a tap: two decks, a silent clip each. */
  #unlockDecks(ctx: AudioContext): void {
    if (!this.#decks.length) {
      for (let i = 0; i < 2; i++) {
        const el = new Audio();
        el.preload = 'auto';
        el.setAttribute('playsinline', '');
        el.disableRemotePlayback = true;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        ctx.createMediaElementSource(el).connect(gain).connect(this.#duck);
        const deck: Deck = { el, gain, key: null, level: 1, end: null, starting: false, fadeEnd: 0, gen: 0 };
        el.addEventListener('ended', () => this.#ended(deck));
        // Never in the background: the lock screen, Control Center or headphones may play the element while the page
        // is hidden (it's the Now Playing item under the 'playback' session). Keep it paused there.
        el.addEventListener('play', () => document.hidden && el.pause());
        // a jump in the playing deck (a seek from outside) re-times the loop hand-off
        el.addEventListener('seeked', () => this.#decks[this.#front] === deck && !this.#wrapping && this.#armWrap());
        this.#decks.push(deck);
      }
    }
    if (this.#decksReady) return;
    this.#silentUrl ??= URL.createObjectURL(silentWav());
    for (const d of this.#decks) {
      // a deck that already holds a track plays it (at gain 0: the fade-in follows); the others a silent clip
      if (!d.key) d.el.src = this.#silentUrl;
      d.el.play().then(
        () => {
          this.#decksReady = true;
          if (!d.key) d.el.pause();
        },
        () => {}
      );
    }
  }

  /** Real files from the manifest replace their placeholders as they decode. */
  #loadFiles(): void {
    if (this.#files || !this.ctx) return;
    const entries = Object.entries(AUDIO.sfx) as [SoundId, string][];
    let failed = false;
    this.#files = Promise.all(
      entries.map(async ([id, path]) => {
        const b = await this.#decode(path);
        if (b) this.#buffers.set(id, b);
        else failed = true;
      })
    ).then(() => {
      if (failed) this.#files = null; // offline on the first tap: a later unlock tries the missing files again
    });
  }

  async #decode(path: string): Promise<AudioBuffer | null> {
    try {
      const res = await fetch(audioUrl(path));
      if (!res.ok || !this.ctx) return null;
      return await this.ctx.decodeAudioData(await res.arrayBuffer());
    } catch {
      return null; // missing or undecodable: the placeholder stays
    }
  }

  /** The buffer of an id: its decoded file, else the placeholder (rendered on first use, then kept). Null while the
   *  renderer is still loading. */
  #buffer(ctx: AudioContext, id: SoundId): AudioBuffer | null {
    let b = this.#buffers.get(id);
    if (!b && this.#synth) {
      const data = this.#synth.render(id, ctx.sampleRate);
      b = ctx.createBuffer(1, data.length, ctx.sampleRate);
      b.getChannelData(0).set(data);
      this.#buffers.set(id, b);
    }
    return b ?? null;
  }

  /** The context a cue may use now, or null. Running, or resuming inside the tap that unlocked it (session.ts
   *  canSound): nothing queues up while locked, interrupted or in the background to burst out later. A context the
   *  idle timer put to sleep is woken by the cue itself. */
  #ready(): AudioContext | null {
    const ctx = this.ctx;
    if (!ctx) return null;
    if (this.#asleep && ctx.state === 'suspended' && !document.hidden) this.#wake(ctx);
    return canSound(ctx.state, clock() - this.#resumeAt) ? ctx : null;
  }

  /** A cue scheduled on a context that isn't running yet is cancelled if it still isn't running shortly after. */
  #dropIfStuck(ctx: AudioContext, cancel: () => void): void {
    if (ctx.state === 'running') return;
    setTimeout(() => ctx.state !== 'running' && cancel(), QUEUED_DROP_MS);
  }

  play(id: SoundId, o: { gain?: number; rate?: number; delay?: number } = {}, late = false): void {
    const ctx = this.#ready();
    if (!ctx) return;
    const buf = this.#buffer(ctx, id);
    if (!buf) {
      // the renderer is still loading (the first tap): play when it arrives, if that's soon
      const t0 = clock();
      if (!late) void this.#loadSynth().then(() => clock() - t0 < LATE_MS && this.play(id, o, true));
      return;
    }
    const def = SOUNDS[id];
    const rate = (o.rate ?? 1) * jitterRate(def.jitter);
    const at = ctx.currentTime + Math.max(0, o.delay ?? 0);
    const dur = buf.duration / rate;
    const r = this.#limiter.admit(id, ctx.currentTime, dur + (at - ctx.currentTime), at);
    if (!r.ok) return;
    for (const k of r.stop) this.#stop(k);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    const g = ctx.createGain();
    g.gain.value = def.gain * (o.gain ?? 1);
    src.connect(g).connect(this.#bus[def.bus]);
    src.onended = () => {
      this.#live.delete(r.key);
      this.#limiter.release(r.key);
      g.disconnect();
    };
    src.start(at);
    this.#live.set(r.key, src);
    if (def.jingle) this.#duckUnder(at, at + dur);
    this.#dropIfStuck(ctx, () => this.#stop(r.key));
    this.#idle.poke();
  }

  #stop(key: number): void {
    try {
      this.#live.get(key)?.stop();
    } catch {
      /* already ended */
    }
    this.#live.delete(key);
    this.#limiter.release(key);
  }

  /** IDLE_SUSPEND_MS without a sound and no music meant to play: let the hardware sleep (the next cue wakes it). */
  #onIdle(): void {
    const ctx = this.ctx;
    const f = this.#decks[this.#front];
    // A track held by an outside ⏸ (holdMusic) or refused by the browser isn't sounding: the next tap restarts it.
    const sounding = !!this.track && !(f.el.paused && !f.starting);
    if (!ctx || ctx.state !== 'running' || sounding || document.hidden) return;
    if (this.#live.size) return this.#idle.poke();
    this.#asleep = true;
    void ctx.suspend().catch(() => {});
  }

  /** The music dips under a jingle and comes back after it. */
  #duckUnder(at: number, until: number): void {
    const p = this.#duck.gain;
    p.cancelScheduledValues(at);
    const plan = duckPlan(at, until);
    p.setValueAtTime(plan[0].gain, plan[0].t);
    for (const pt of plan.slice(1)) p.linearRampToValueAtTime(pt.gain, pt.t);
  }

  /** Muffle the music under the phone and sheets (a low-pass, as NH does under its menus). */
  muffle(on: boolean): void {
    if (!this.ctx) return;
    this.#muffle.frequency.setTargetAtTime(on ? MUFFLE_HZ : 20000, this.ctx.currentTime, 0.12);
  }

  /** Bus levels from the settings (音量 on a squared curve, so the slider feels even). The first time they are set at
   *  once, so the unlocking tap's own sound isn't swallowed by a ramp from 0. */
  setLevels(s: SoundSettings): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const first = !this.#levels;
    this.#levels = { ...s };
    const at = ctx.currentTime;
    const set = (p: AudioParam, v: number) => (first ? p.setValueAtTime(v, at) : p.setTargetAtTime(v, at, 0.05));
    set(this.#master.gain, s.volume * s.volume);
    set(this.#bus.music.gain, s.music ? LEVELS.music : 0);
    set(this.#bus.ambient.gain, s.music ? LEVELS.ambient : 0);
    set(this.#bus.sfx.gain, s.sfx ? LEVELS.sfx : 0);
  }

  /** A music file as a blob URL. The whole file (0.4–0.9 MB) is fetched through the service worker's audio cache
   *  and played from memory: the element never sends Range requests the worker would have to answer, and an hour
   *  heard once plays offline. A track change keeps only its own file. */
  #blob(path: string): Promise<string | null> {
    let p = this.#blobs.get(path);
    if (!p) {
      p = fetch(audioUrl(path))
        .then(async (r) => (r.ok ? URL.createObjectURL(await r.blob()) : null))
        .catch(() => null);
      p.then((url) => {
        if (url === null) this.#blobs.delete(path);
        else if (this.#blobs.get(path) === p) this.#urls.set(path, url);
      });
      this.#blobs.set(path, p);
    }
    return p;
  }

  /** Fetch a file now so a later change starts at once (the next hour a minute before it; the current hour at
   *  launch when ミュージック is on, so the first tap can start it inside the tap). Needs no context. */
  prefetch(path: string): void {
    void this.#blob(path);
  }

  /** Drop every blob but these paths. */
  #trimBlobs(keep: string[]): void {
    for (const [path, p] of this.#blobs) {
      if (keep.includes(path)) continue;
      this.#blobs.delete(path);
      this.#urls.delete(path);
      void p.then((url) => url && URL.revokeObjectURL(url));
    }
  }

  /** Play `track` under `key` (an hour like 'sunny/07', or 'opening'), crossfading from the one playing
   *  (hourly.ts crossfadePlan). The same key again fades it back in where it is if it isn't audibly up (paused, or
   *  played by iOS at gain 0 while hidden). Looping tracks wrap seamlessly; a one-shot calls `onended`. Null = fade
   *  out to silence. */
  async setTrack(key: string | null, track: MusicTrack | null, loop = true): Promise<void> {
    const ctx = this.ctx;
    if (!ctx || !this.#decks.length || (key && this.#held)) return; // held: not even a cue's wake or coming back
    const cur = this.#decks[this.#front];
    if (key && cur.key === key) {
      const fading = cur.starting || ctx.currentTime < cur.fadeEnd;
      if (!fading && needsFadeIn(cur.el.paused, cur.gain.gain.value, cur.level)) this.#fadeIn(cur, crossfadePlan(ctx.currentTime, false));
      return;
    }
    const token = ++this.#token;
    this.#cancelWrap();
    const playing = !!cur.key && !cur.el.paused;
    const plan = crossfadePlan(ctx.currentTime, playing);
    this.#fadeOut(cur, plan.outFrom, plan.outTo);
    if (!key || !track) return;
    // Already fetched (prefetched at launch, or heard this session): no await, so when this runs inside a tap the
    // deck's play() below is inside it too, and iOS can't refuse it. Otherwise wait for the file; the deck was
    // unlocked by its silent clip in the first tap, and a refused play() is retried by the next tap.
    const url = this.#urls.get(track.file) ?? (await this.#blob(track.file));
    if (!url || token !== this.#token) return; // offline and never heard: silence until the next change
    this.#trimBlobs([track.file]);
    this.#front = 1 - this.#front;
    const next = this.#decks[this.#front];
    next.key = key;
    next.gen++;
    next.level = trackLevel(track.gain);
    next.end = loop && track.end ? track.end : null;
    next.el.loop = loop && next.end === null;
    next.starting = true;
    next.gain.gain.cancelScheduledValues(0);
    next.gain.gain.value = 0;
    next.el.src = url;
    next.el.play().catch(() => {}); // at gain 0: the seek and the fade-in follow
    // seek once the element knows the file (start = where the loop begins musically); an undecodable file goes on
    const known = next.el.readyState >= 1 || (await firstEvent(next.el, ['loadedmetadata', 'error'])) === 'loadedmetadata';
    if (known) {
      try {
        next.el.currentTime = track.start;
      } catch {
        /* plays from 0 */
      }
    }
    if (token !== this.#token) return void (next.starting = false);
    const lead = Math.max(0, plan.inFrom - ctx.currentTime);
    this.#fadeIn(next, { inFrom: ctx.currentTime + lead, inTo: ctx.currentTime + lead + (plan.inTo - plan.inFrom) });
  }

  #fadeIn(d: Deck, p: { inFrom: number; inTo: number }): void {
    const ctx = this.ctx!;
    const g = d.gain.gain;
    g.cancelScheduledValues(0);
    g.setValueAtTime(0, Math.max(ctx.currentTime, p.inFrom));
    g.linearRampToValueAtTime(d.level, p.inTo);
    d.fadeEnd = p.inTo;
    d.starting = true;
    const key = d.key, token = this.#token;
    // a pause(), a newer change or the page hiding meanwhile cancels the start (no music from the background)
    setTimeout(() => {
      d.starting = false;
      if (token !== this.#token || d.key !== key || document.hidden) return;
      d.el.play().then(() => this.#armWrap(), () => {});
    }, Math.max(0, (p.inFrom - ctx.currentTime) * 1000));
  }

  #fadeOut(d: Deck, from: number, to: number): void {
    if (!d.key) return;
    const g = d.gain.gain;
    g.cancelScheduledValues(0);
    g.setValueAtTime(g.value, from);
    g.linearRampToValueAtTime(0, Math.max(from + 0.05, to));
    d.key = null; // no longer the one meant to sound (a return to its key starts it afresh)
    const gen = ++d.gen;
    d.starting = false;
    d.fadeEnd = 0;
    // Not if the deck was given a track since (even the same key: the flip after a quick off/on reuses this deck).
    setTimeout(() => d.gen === gen && d.el.pause(), (to - (this.ctx?.currentTime ?? 0)) * 1000 + 80);
  }

  /** A deck reached the end of its file: a one-shot (the opening) is over; a hand-off track whose hand-off didn't
   *  happen (timers held up) carries on from the musically same point, with a short gap rather than silence. */
  #ended(d: Deck): void {
    if (!d.key) return;
    if (d.end !== null) {
      try {
        d.el.currentTime = Math.max(0, d.el.duration - d.end);
      } catch {
        /* from 0 */
      }
      if (!document.hidden) d.el.play().then(() => this.#armWrap(), () => {});
    } else if (!d.el.loop) this.onended?.(d.key);
  }

  /** The loop hand-off (session.ts WRAP). A few seconds before the period ends the idle deck loads the same file;
   *  once the playing deck is inside the copied tail, the idle one starts at the matching point, is lined up by its
   *  reported position, and takes over with a short crossfade. */
  #armWrap(): void {
    clearTimeout(this.#wrapTimer);
    const ctx = this.ctx;
    const a = this.#decks[this.#front];
    if (!ctx || !a?.key || a.end === null || a.el.paused || this.#wrapping) return;
    const end = a.end;
    const toEnd = end - a.el.currentTime;
    if (toEnd > WRAP.prep + 0.5) {
      // re-read the position closer to the end (corrects any drift between the timer and the element)
      this.#wrapTimer = setTimeout(() => this.#armWrap(), (toEnd - WRAP.prep) * 1000);
      return;
    }
    const b = this.#decks[1 - this.#front];
    if (b.key) {
      this.#wrapTimer = setTimeout(() => this.#armWrap(), 500); // an hour's fade-out still on it
      return;
    }
    void this.#handOff(a, b, end);
  }

  async #handOff(a: Deck, b: Deck, end: number): Promise<void> {
    const ctx = this.ctx!;
    const token = this.#token, wrap = ++this.#wrapToken, key = a.key;
    const stale = () =>
      token !== this.#token || wrap !== this.#wrapToken || a.key !== key || this.#decks[this.#front] !== a || document.hidden;
    this.#wrapping = true;
    b.gain.gain.cancelScheduledValues(0);
    b.gain.gain.value = 0;
    b.el.loop = false;
    if (b.el.src !== a.el.src) {
      b.el.src = a.el.src;
      const loaded = firstEvent(b.el, ['loadedmetadata', 'error']);
      b.el.load();
      await loaded;
    }
    const tail = (Number.isFinite(b.el.duration) ? b.el.duration : a.el.duration) - end;
    if (stale() || !(tail > 1)) return void (this.#wrapping = false);
    // wait until the playing deck is inside the copy
    const toTail = end + WRAP.into - a.el.currentTime;
    if (toTail > 0) await wait(toTail * 1000);
    if (stale()) return this.#cancelWrap();
    let lag = 0.03; // the incoming deck's start-up delay, learnt on each try
    let target = wrapTarget(a.el.currentTime, end, tail - 1);
    if (target === null) {
      // not in the copy after all (the deck was moved meanwhile): try again from its new place; past it, the
      // end-of-file fallback carries on
      const early = a.el.currentTime < end;
      this.#cancelWrap();
      if (early) this.#armWrap();
      return;
    }
    b.el.currentTime = target + lag;
    try {
      await b.el.play();
    } catch {
      return this.#cancelWrap();
    }
    for (let i = 0; i < WRAP.tries; i++) {
      await wait(50);
      if (stale()) return this.#cancelWrap();
      target = wrapTarget(a.el.currentTime, end, tail - 0.4);
      if (target === null) break;
      const off = target - b.el.currentTime;
      if (Math.abs(off) <= WRAP.tolerance) break;
      lag += off;
      b.el.currentTime = target + lag;
      await firstEvent(b.el, ['seeked'], 250);
    }
    if (stale()) return this.#cancelWrap();
    const now = ctx.currentTime;
    const ga = a.gain.gain, gb = b.gain.gain;
    gb.cancelScheduledValues(0);
    gb.setValueAtTime(0, now);
    gb.linearRampToValueAtTime(a.level, now + WRAP.fade);
    ga.cancelScheduledValues(0);
    ga.setValueAtTime(ga.value, now);
    ga.linearRampToValueAtTime(0, now + WRAP.fade);
    Object.assign(b, { key, level: a.level, end, starting: false, fadeEnd: now + WRAP.fade, gen: b.gen + 1 });
    Object.assign(a, { key: null, starting: false, fadeEnd: 0 });
    const gen = ++a.gen;
    this.#front = this.#decks.indexOf(b);
    this.#wrapping = false;
    setTimeout(() => a.gen === gen && a.el.pause(), WRAP.fade * 1000 + 80);
    this.#armWrap();
  }

  /** Stop a hand-off in progress: the idle deck it was readying goes quiet again. */
  #cancelWrap(): void {
    clearTimeout(this.#wrapTimer);
    ++this.#wrapToken;
    const b = this.#decks[1 - this.#front];
    if (this.#wrapping && b && !b.key) {
      b.gain.gain.cancelScheduledValues(0);
      b.gain.gain.value = 0;
      b.el.pause();
    }
    this.#wrapping = false;
  }

  /** The key of the track meant to be sounding (null: none). */
  get track(): string | null {
    return this.#decks[this.#front]?.key ?? null;
  }

  stopMusic(): void {
    ++this.#token;
    this.#cancelWrap();
    const ctx = this.ctx;
    const cur = this.#decks[this.#front];
    if (ctx && cur?.key) this.#fadeOut(cur, ctx.currentTime, ctx.currentTime + 0.6);
    this.#idle.poke();
  }

  /** Paused from outside (the lock screen's or Control Center's ⏸, via the Media Session): fade out and pause, but
   *  keep the track and its place. The next tap in the app brings it back (needsUnlock: a stalled front deck). */
  holdMusic(): void {
    const ctx = this.ctx;
    const cur = this.#decks[this.#front];
    if (!ctx || !cur?.key) return;
    const token = ++this.#token;
    this.#cancelWrap();
    const g = cur.gain.gain;
    g.cancelScheduledValues(0);
    g.setValueAtTime(g.value, ctx.currentTime);
    g.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    cur.fadeEnd = 0;
    const key = cur.key;
    this.#held = true;
    setTimeout(() => token === this.#token && cur.key === key && cur.el.pause(), 380);
    this.#idle.poke(); // held, nothing sounds: the context may sleep (#onIdle)
  }

  /** The Media Session's ▶ (in front): the held track may play again. */
  unhold(): void {
    this.#held = false;
  }

  /** The ambience layers to sound now (only ids with a file): new ones fade in, gone ones fade out (`immediate`: stop
   *  at once, for pause(): the suspended clock would freeze a fade, so they'd still sound on the way back). Loops are
   *  decoded buffers (short, mono), so they loop without the gap an <audio loop> can have. */
  async setAmbient(layers: { id: AmbientId; gain: number }[], immediate = false): Promise<void> {
    const ctx = this.ctx;
    if (!ctx) return;
    const token = ++this.#ambientToken;
    const want = new Map(layers.map((l) => [l.id, l.gain]));
    for (const [id, a] of this.#ambient) {
      if (want.has(id)) {
        a.gain.gain.setTargetAtTime(want.get(id)!, ctx.currentTime, 0.5);
        continue;
      }
      if (immediate) {
        a.gain.gain.cancelScheduledValues(0);
        a.gain.gain.value = 0;
        a.src.stop();
      } else {
        a.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
        a.src.stop(ctx.currentTime + 2.5);
      }
      this.#ambient.delete(id);
    }
    for (const [id, gain] of want) {
      if (this.#ambient.has(id)) continue;
      const path = AUDIO.ambient[id];
      if (!path) continue;
      if (!this.#ambientBuffers.has(id)) this.#ambientBuffers.set(id, this.#decode(path));
      const buf = await this.#ambientBuffers.get(id)!;
      if (!buf) this.#ambientBuffers.delete(id); // offline: the next change tries again
      if (!buf || token !== this.#ambientToken || this.#ambient.has(id)) continue;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.setTargetAtTime(gain, ctx.currentTime, 0.8);
      src.connect(g).connect(this.#bus.ambient);
      src.onended = () => g.disconnect();
      src.start(ctx.currentTime, Math.random() * buf.duration); // a random point: not the same surf every launch
      this.#ambient.set(id, { src, gain: g });
    }
  }

  /** The page went to the background (or the phone locked): silence at once and let the hardware sleep. The front
   *  deck keeps its track and position, so coming back fades the same hour back in where it was. */
  pause(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    ++this.#token;
    this.#cancelWrap();
    this.#idle.cancel();
    clearTimeout(this.#sleepTimer);
    for (const d of this.#decks) {
      d.gain.gain.cancelScheduledValues(0);
      d.gain.gain.value = 0;
      d.fadeEnd = 0;
      d.starting = false;
      d.el.pause();
    }
    void this.setAmbient([], true);
    this.#asleep = false;
    void ctx.suspend().catch(() => {});
  }

  /** Back in front, or a setting changed (iOS may refuse outside a tap; the gesture listener unlocks it then). */
  resume(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    clearTimeout(this.#sleepTimer);
    if (ctx.state !== 'running') this.#wake(ctx);
    this.#idle.poke();
  }

  /** 音量 at 0 with a kind on: muted, not off. The master is already at 0 (setLevels); after a moment the decks pause
   *  where they are and the context sleeps, so turning the volume up again resumes the same track in place. */
  hush(): void {
    clearTimeout(this.#sleepTimer);
    this.#sleepTimer = setTimeout(() => this.pause(), 800);
  }

  /** Everything off: no music, no ambience, a suspended context. */
  sleep(): void {
    this.stopMusic();
    void this.setAmbient([]);
    clearTimeout(this.#sleepTimer);
    this.#sleepTimer = setTimeout(() => void this.ctx?.suspend().catch(() => {}), 800);
  }
}
