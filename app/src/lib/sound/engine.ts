// The Web Audio engine (docs/design/sound.md §6, §11). Browser only; the pure rules it follows live in mix.ts,
// hourly.ts and ambient.ts (tested there). One AudioContext, created inside the first tap after a sound setting is
// on (iOS only starts audio from a gesture), never while everything is off.
//
//   effects  AudioBufferSource → gain ─┬→ sfx bus ──┐
//   blips    AudioBufferSource → gain ─┴→ voice bus ┼→ master (音量) → speakers
//   music    <audio> deck A/B → gain ─┐            │
//   ambience loop sources → ambient ──┴→ duck → muffle (low-pass) → music bus
//
// Music streams from two <audio> elements routed into the graph (decoding a whole 1–2 minute track would cost
// 20–40 MB of PCM on a phone); their levels are gain nodes, because iOS ignores HTMLMediaElement.volume. Each hour is
// one seamless loop period (scripts/music.ts), so `loop` wraps without a seam. Effects are small decoded buffers.
import { SOUNDS, type Bus, type SoundId } from './ids.ts';
import { DUCK, VoiceLimiter, duckPlan, jitterRate } from './mix.ts';
import { crossfadePlan, type MusicTrack } from './hourly.ts';
import { AUDIO, audioUrl } from './manifest.ts';
import type { AmbientId } from './ambient.ts';
import type { SoundSettings } from './settings.ts';

/** Bus levels at full volume. NH's BGM is gentle and sits well under the effects; blips are quiet. */
const LEVELS = { music: 0.3, ambient: 0.28, sfx: 0.9, voice: 0.4 } as const;
/** The music when muffled (a sheet or the phone is up: NH muffles its BGM under the phone and menus). */
const MUFFLE_HZ = 900;

interface Deck {
  el: HTMLAudioElement;
  gain: GainNode;
  /** What it holds (an hour's key, 'opening') and since when it is the one meant to sound. */
  key: string | null;
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

export class Engine {
  ctx: AudioContext | null = null;
  #master!: GainNode;
  #bus!: Record<Bus | 'ambient', GainNode>;
  #duck!: GainNode;
  #muffle!: BiquadFilterNode;
  #synth: Synth | null = null;
  #synthLoad: Promise<void> | null = null;
  #buffers = new Map<SoundId, AudioBuffer>();
  #files: Promise<void> | null = null;
  #limiter = new VoiceLimiter();
  #live = new Map<number, AudioBufferSourceNode>();
  #decks: Deck[] = [];
  #front = 0;
  #token = 0;
  /** Music files as blob URLs (path → URL), the current and the prefetched next one only. */
  #blobs = new Map<string, Promise<string | null>>();
  #ambient = new Map<AmbientId, { src: AudioBufferSourceNode; gain: GainNode }>();
  #ambientBuffers = new Map<AmbientId, Promise<AudioBuffer | null>>();
  #ambientToken = 0;
  #resuming = false;
  /** Called when a one-shot track (the opening) ends. */
  onended: ((key: string) => void) | null = null;

  /** The context, created on first use (inside a tap on iOS). Null where Web Audio is missing. */
  #ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!AC) return null;
    // iOS 17+ (Audio Session API): 'ambient' obeys the Ring/Silent switch and mixes with the user's own music or
    // podcast instead of stopping it, like a game; and an ambient app never takes the lock screen's Now Playing.
    try {
      const nav = navigator as AudioSessionNav;
      if (nav.audioSession) nav.audioSession.type = 'ambient';
    } catch {
      /* not supported */
    }
    const ctx = new AC({ latencyHint: 'interactive' });
    const g = () => ctx.createGain();
    this.#master = g();
    this.#master.connect(ctx.destination);
    this.#bus = { music: g(), sfx: g(), voice: g(), ambient: g() };
    for (const b of Object.values(this.#bus)) b.gain.value = 0;
    this.#duck = g();
    this.#muffle = ctx.createBiquadFilter();
    this.#muffle.type = 'lowpass';
    this.#muffle.frequency.value = 20000;
    this.#muffle.Q.value = 0.5;
    this.#bus.sfx.connect(this.#master);
    this.#bus.voice.connect(this.#master);
    this.#bus.ambient.connect(this.#duck);
    this.#duck.connect(this.#muffle).connect(this.#bus.music).connect(this.#master);
    this.ctx = ctx;
    return ctx;
  }

  /** Waiting for a tap: the context is not running yet, or music wants its decks unlocked. */
  needsUnlock(music: boolean): boolean {
    return !this.ctx || this.ctx.state !== 'running' || (music && !this.#decks.length);
  }

  /** Call synchronously inside a user gesture (pointerup / touchend / click / keydown). */
  unlock(music: boolean): void {
    const ctx = this.#ensure();
    if (!ctx) return;
    if (ctx.state !== 'running') {
      this.#resuming = true;
      ctx.resume().then(
        () => (this.#resuming = false),
        () => (this.#resuming = false)
      );
    }
    // older iOS: a buffer started inside the tap opens the output
    const src = ctx.createBufferSource();
    src.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    src.connect(ctx.destination);
    src.start();
    if (music) this.#unlockDecks(ctx);
    // the placeholder renderer and the effect files load after the tap (sounds asked for meanwhile are skipped)
    this.#synthLoad ??= import('./synth.ts').then((m) => void (this.#synth = m));
    this.#loadFiles();
  }

  /** Resolves once effects can sound (the placeholder renderer has loaded after the first unlock). */
  whenReady(): Promise<void> {
    return this.#synthLoad ?? Promise.resolve();
  }

  /** iOS lets an <audio> element play later only if it played once inside a tap: two decks, a silent clip each. */
  #unlockDecks(ctx: AudioContext): void {
    if (this.#decks.length) return;
    const silent = URL.createObjectURL(silentWav());
    for (let i = 0; i < 2; i++) {
      const el = new Audio();
      el.preload = 'auto';
      el.setAttribute('playsinline', '');
      el.disableRemotePlayback = true;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      ctx.createMediaElementSource(el).connect(gain).connect(this.#duck);
      el.src = silent;
      el.play().then(() => el.pause(), () => {});
      const deck: Deck = { el, gain, key: null };
      el.addEventListener('ended', () => deck.key && !el.loop && this.onended?.(deck.key));
      this.#decks.push(deck);
    }
  }

  /** Real files from the manifest replace their placeholders as they decode. */
  #loadFiles(): void {
    if (this.#files || !this.ctx) return;
    const entries = Object.entries(AUDIO.sfx) as [SoundId, string][];
    this.#files = Promise.all(
      entries.map(async ([id, path]) => {
        const b = await this.#decode(path);
        if (b) this.#buffers.set(id, b);
      })
    ).then(() => {});
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

  /** Sounds only while running (or resuming inside the tap that unlocked it): nothing queues up while locked or in
   *  the background to burst out later. */
  #ready(): AudioContext | null {
    const ctx = this.ctx;
    return ctx && (ctx.state === 'running' || this.#resuming) ? ctx : null;
  }

  play(id: SoundId, o: { gain?: number; rate?: number; delay?: number } = {}): void {
    const ctx = this.#ready();
    const buf = ctx && this.#buffer(ctx, id);
    if (!ctx || !buf) return;
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
  }

  #stop(key: number): void {
    try {
      this.#live.get(key)?.stop();
    } catch {
      /* already ended */
    }
    this.#live.delete(key);
  }

  /** A line of dialogue: one blip per entry (s from now, playback rate). They never overlap, so they skip the
   *  voice limit. Returns a canceller (the line was tapped through or changed). */
  blips(id: 'blip-host' | 'blip-villager', times: number[], rates: number[]): () => void {
    const ctx = this.#ready();
    const buf = ctx && this.#buffer(ctx, id);
    if (!ctx || !buf || !times.length) return () => {};
    const out = ctx.createGain();
    out.gain.value = SOUNDS[id].gain;
    out.connect(this.#bus.voice);
    const t0 = ctx.currentTime + 0.02;
    const srcs = times.map((t, i) => {
      const s = ctx.createBufferSource();
      s.buffer = buf;
      s.playbackRate.value = rates[i] ?? 1;
      s.connect(out);
      s.start(t0 + t);
      return s;
    });
    srcs[srcs.length - 1].onended = () => out.disconnect();
    return () => {
      const now = ctx.currentTime;
      out.gain.setTargetAtTime(0, now, 0.01);
      for (const s of srcs) {
        try {
          s.stop(now + 0.05);
        } catch {
          /* ended */
        }
      }
    };
  }

  /** The music dips under a jingle and comes back after it. */
  #duckUnder(at: number, until: number): void {
    const p = this.#duck.gain;
    p.cancelScheduledValues(at);
    const plan = duckPlan(at, until, DUCK);
    p.setValueAtTime(plan[0].gain, plan[0].t);
    for (const pt of plan.slice(1)) p.linearRampToValueAtTime(pt.gain, pt.t);
  }

  /** Muffle the music under the phone and sheets (a low-pass, as NH does under its menus). */
  muffle(on: boolean): void {
    if (!this.ctx) return;
    this.#muffle.frequency.setTargetAtTime(on ? MUFFLE_HZ : 20000, this.ctx.currentTime, 0.12);
  }

  /** Bus levels from the settings (音量 on a squared curve, so the slider feels even). */
  setLevels(s: SoundSettings): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const at = ctx.currentTime;
    const set = (p: AudioParam, v: number) => p.setTargetAtTime(v, at, 0.05);
    set(this.#master.gain, s.volume * s.volume);
    set(this.#bus.music.gain, s.music ? LEVELS.music : 0);
    set(this.#bus.ambient.gain, s.music ? LEVELS.ambient : 0);
    set(this.#bus.sfx.gain, s.sfx ? LEVELS.sfx : 0);
    set(this.#bus.voice.gain, s.voice ? LEVELS.voice : 0);
  }

  /** A music file as a blob URL. The whole file (0.4–0.8 MB) is fetched through the service worker's audio cache
   *  and played from memory: the element never sends Range requests the worker would have to answer, and an hour
   *  heard once plays offline. Only the current and the prefetched next file are kept. */
  #blob(path: string): Promise<string | null> {
    let p = this.#blobs.get(path);
    if (!p) {
      p = fetch(audioUrl(path))
        .then(async (r) => (r.ok ? URL.createObjectURL(await r.blob()) : null))
        .catch(() => null);
      p.then((url) => url === null && this.#blobs.delete(path));
      this.#blobs.set(path, p);
    }
    return p;
  }

  /** Fetch a file now so a later change starts at once (the next hour, a minute before it). */
  prefetch(path: string): void {
    void this.#blob(path);
  }

  /** Drop every blob but these paths. */
  #trimBlobs(keep: string[]): void {
    for (const [path, p] of this.#blobs) {
      if (keep.includes(path)) continue;
      this.#blobs.delete(path);
      void p.then((url) => url && URL.revokeObjectURL(url));
    }
  }

  /** Play `track` under `key` (an hour like 'sunny/07', or 'opening'), crossfading from the one playing
   *  (hourly.ts crossfadePlan). The same key again resumes it in place with a short fade-in. Looping tracks wrap
   *  seamlessly; a one-shot calls `onended`. Null = fade out to silence. */
  async setTrack(key: string | null, track: MusicTrack | null, loop = true, prefetched: string[] = []): Promise<void> {
    const ctx = this.ctx;
    if (!ctx || !this.#decks.length) return;
    const cur = this.#decks[this.#front];
    if (key && cur.key === key) {
      if (cur.el.paused) this.#fadeIn(cur, crossfadePlan(ctx.currentTime, false));
      return;
    }
    const token = ++this.#token;
    const playing = !!cur.key && !cur.el.paused;
    const plan = crossfadePlan(ctx.currentTime, playing);
    this.#fadeOut(cur, plan.outFrom, plan.outTo);
    if (!key || !track) return;
    const url = await this.#blob(track.file);
    if (!url || token !== this.#token) return; // offline and never heard: silence until the next change
    this.#trimBlobs([track.file, ...prefetched]);
    this.#front = 1 - this.#front;
    const next = this.#decks[this.#front];
    next.key = key;
    next.el.loop = loop;
    next.el.src = url;
    // seek once the element knows the file (start = where the loop begins musically)
    await new Promise<void>((done) => {
      const go = () => {
        try {
          next.el.currentTime = track.start;
        } catch {
          /* plays from 0 */
        }
        done();
      };
      if (next.el.readyState >= 1) go();
      else next.el.addEventListener('loadedmetadata', go, { once: true });
      next.el.load();
    });
    if (token !== this.#token) return;
    const lead = Math.max(0, plan.inFrom - ctx.currentTime);
    this.#fadeIn(next, { inFrom: ctx.currentTime + lead, inTo: ctx.currentTime + lead + (plan.inTo - plan.inFrom) });
  }

  #fadeIn(d: Deck, p: { inFrom: number; inTo: number }): void {
    const ctx = this.ctx!;
    const g = d.gain.gain;
    g.cancelScheduledValues(0);
    g.setValueAtTime(0, Math.max(ctx.currentTime, p.inFrom));
    g.linearRampToValueAtTime(1, p.inTo);
    const key = d.key;
    setTimeout(() => d.key === key && d.el.play().catch(() => {}), Math.max(0, (p.inFrom - ctx.currentTime) * 1000));
  }

  #fadeOut(d: Deck, from: number, to: number): void {
    if (!d.key) return;
    const g = d.gain.gain;
    g.cancelScheduledValues(0);
    g.setValueAtTime(g.value, from);
    g.linearRampToValueAtTime(0, Math.max(from + 0.05, to));
    const key = d.key;
    d.key = null; // no longer the one meant to sound (a return to its key starts it afresh)
    setTimeout(() => {
      if (d.key === null || d.key === key) d.el.pause();
    }, (to - (this.ctx?.currentTime ?? 0)) * 1000 + 80);
  }

  /** The key of the track meant to be sounding (null: none). */
  get track(): string | null {
    return this.#decks[this.#front]?.key ?? null;
  }

  stopMusic(): void {
    ++this.#token;
    const ctx = this.ctx;
    const cur = this.#decks[this.#front];
    if (ctx && cur?.key) this.#fadeOut(cur, ctx.currentTime, ctx.currentTime + 0.6);
  }

  /** The ambience layers to sound now (only ids with a file): new ones fade in, gone ones fade out. Loops are decoded
   *  buffers (short, mono), so they loop without the gap an <audio loop> can have. */
  async setAmbient(layers: { id: AmbientId; gain: number }[]): Promise<void> {
    const ctx = this.ctx;
    if (!ctx) return;
    const token = ++this.#ambientToken;
    const want = new Map(layers.map((l) => [l.id, l.gain]));
    for (const [id, a] of this.#ambient) {
      if (want.has(id)) {
        a.gain.gain.setTargetAtTime(want.get(id)!, ctx.currentTime, 0.5);
        continue;
      }
      a.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      a.src.stop(ctx.currentTime + 2.5);
      this.#ambient.delete(id);
    }
    for (const [id, gain] of want) {
      if (this.#ambient.has(id)) continue;
      const path = AUDIO.ambient[id];
      if (!path) continue;
      if (!this.#ambientBuffers.has(id)) this.#ambientBuffers.set(id, this.#decode(path));
      const buf = await this.#ambientBuffers.get(id)!;
      if (!buf || token !== this.#ambientToken || this.#ambient.has(id)) continue;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.setTargetAtTime(gain, ctx.currentTime, 0.8);
      src.connect(g).connect(this.#bus.ambient);
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
    for (const d of this.#decks) {
      d.gain.gain.cancelScheduledValues(0);
      d.gain.gain.value = 0;
      d.el.pause();
    }
    void this.setAmbient([]);
    void ctx.suspend().catch(() => {});
  }

  /** Back in front (iOS may refuse until the next tap; the gesture listener unlocks it then). */
  resume(): void {
    void this.ctx?.resume().catch(() => {});
  }

  /** Everything off: no music, no ambience, a suspended context. */
  sleep(): void {
    this.stopMusic();
    void this.setAmbient([]);
    setTimeout(() => void this.ctx?.suspend().catch(() => {}), 800);
  }
}
