// YouTube's embed driven over postMessage (docs/english.md "The player"): no iframe_api script (a third-party
// script-src). The frame is told `listening` until it answers; it reports `onReady`, `infoDelivery` (the time, the
// state) and `onError`; it's sent `command`s (seekTo, playVideo, pauseVideo). A segment pauses SEG_TAIL past its end:
// the time between deliveries is extrapolated (≤ LEAP_S for the stop), checked every 100 ms. A play that doesn't start
// (iOS wants a tap on the video itself the first time) says so (`stuck`). The quality can't be set (setPlaybackQuality
// has been a no-op since YouTube's 2019-10-24 revision): YouTube picks it from the frame's device pixels, so the player
// is full width. Captions off, unless the lesson's 字幕 choice turns YouTube's own on (`setCaptions`; this player's, so a
// lesson's: off again at the next): English, or Japanese (a Japanese track if the video has one, else YouTube's
// auto-translation of the English).
import type { CcSize } from './prefs.ts';
// (字幕の大きさ's sizes live with its store, prefs.ts: a plain module, no runes)
export { CC_SIZES, type CcSize } from './prefs.ts';

export const YT_ORIGIN = 'https://www.youtube-nocookie.com';

/** The embed's URL: the JS API on for our origin, inline on iOS, no controls (ours drive it), no related videos. */
export const embedUrl = (video: string, origin: string): string =>
  `${YT_ORIGIN}/embed/${encodeURIComponent(video)}?enablejsapi=1&playsinline=1&controls=0&rel=0&modestbranding=1&cc_load_policy=0&iv_load_policy=3&fs=0&origin=${encodeURIComponent(origin)}`;

export type YtState = 'loading' | 'ready' | 'playing' | 'paused' | 'buffering' | 'ended' | 'error';

/** The player's state for one of YouTube's codes (−1 unstarted and 5 cued: ready). */
export function stateOf(code: unknown): YtState | null {
  switch (code) {
    case -1: case 5: return 'ready';
    case 0: return 'ended';
    case 1: return 'playing';
    case 2: return 'paused';
    case 3: return 'buffering';
    default: return null;
  }
}

/** A message from the frame (JSON text), or null. */
export function readMessage(data: unknown): { event: string; info: unknown } | null {
  if (typeof data !== 'string') return null;
  try {
    const m: unknown = JSON.parse(data);
    return m && typeof m === 'object' && typeof (m as { event?: unknown }).event === 'string' ? { event: (m as { event: string }).event, info: (m as { info?: unknown }).info } : null;
  } catch {
    return null;
  }
}

/** The 字幕 choice: none, YouTube's English track, or Japanese (its track, or the English auto-translated). */
export type CcMode = 'off' | 'en' | 'ja';
/** What the frame reports of its captions (the module's tracklist and track), as language codes. */
export interface CcInfo {
  tracks?: string[];
  track?: { lang: string };
}

const isJa = (l: string | undefined) => !!l && /^ja\b/i.test(l);
const langsOf = (v: unknown): string[] | undefined =>
  Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : (x as { languageCode?: unknown } | null)?.languageCode)).filter((l): l is string => typeof l === 'string') : undefined;

/** The captions' info in a delivery (infoDelivery or apiInfoDelivery), wherever the frame nests it (≤ 3 deep), or null.
 *  The embed's shape here is undocumented: anything else is ignored. */
export function captionsOf(info: unknown, depth = 0): CcInfo | null {
  if (!info || typeof info !== 'object' || Array.isArray(info) || depth > 3) return null;
  const o = info as Record<string, unknown>;
  const tracks = langsOf(o.tracklist);
  const tk = o.track && typeof o.track === 'object' ? (o.track as { languageCode?: unknown }) : null;
  const track = typeof tk?.languageCode === 'string' ? { lang: tk.languageCode } : undefined;
  if (tracks || track) return { ...(tracks && { tracks }), ...(track && { track }) };
  for (const v of Object.values(o)) {
    const r = captionsOf(v, depth + 1);
    if (r) return r;
  }
  return null;
}

/** No answer to `listening` in this long: the embed is unavailable (blocked, or the network gave out). */
const HELLO_MS = 12_000;
/** A play asked this long ago that hasn't started: `stuck`. */
const STUCK_MS = 2_500;
/** A seek's deliveries from before it are let go this long at most. */
const SEEK_MS = 3_000;
/** A segment plays on this long past its end (s): a word's tail, the embed's own lag, never cut. */
const SEG_TAIL = 0.4;
/** The stop trusts the time extrapolated this far past the last delivery at most (s): a stall the frame hasn't told yet
 *  never pauses a segment early. */
const LEAP_S = 1;

export class YtPlayer {
  state = $state<YtState>('loading');
  /** The time now, s (about: extrapolated while playing). */
  time = $state(0);
  /** YouTube's error code (100 gone, 101/150 not embeddable, 153 no referrer…), null for no answer at all. */
  error = $state<number | null>(null);
  /** A play was asked and nothing started. */
  stuck = $state(false);
  /** The video's length, s (0 until the frame says). */
  duration = $state(0);
  /** The speeds the frame offers (its availablePlaybackRates; [] until it says), and the one set. */
  rates = $state<number[]>([]);
  rate = $state(1);
  /** YouTube's captions (the 字幕 choice; off by default). */
  captions = $state<CcMode>('off');
  /** The captions' size (字幕の大きさ; 大 by default: Player.svelte sets this phone's). */
  ccSize = $state<CcSize>(1);

  #frame: HTMLIFrameElement;
  #last = { t: 0, at: 0 };
  #stopAt: number | null = null;
  /** A seek on its way: deliveries' times ignored until one is near it (or SEEK_MS has passed: one landing further off,
   *  a keyframe's, never holds the segment's stop back). */
  #seek: number | null = null;
  #seekAt = 0;
  #heard = false;
  /** The last play asked has started (playing or buffering since). */
  #started = true;
  #hello: ReturnType<typeof setInterval> | undefined;
  #tick: ReturnType<typeof setInterval>;
  #stuckTimer: ReturnType<typeof setTimeout> | undefined;
  /** The captions' info the frame reported (null: none yet). */
  #cc: CcInfo | null = null;
  /** This play's Japanese track asked already. */
  #jaTried = false;

  constructor(frame: HTMLIFrameElement) {
    this.#frame = frame;
    addEventListener('message', this.#onMessage);
    frame.addEventListener('load', this.#greet);
    this.#greet();
    this.#tick = setInterval(this.#check, 100);
  }

  /** Play from `from` s, pausing SEG_TAIL past `to` (null: to the end). */
  play(from: number, to: number | null): void {
    this.#stopAt = to === null ? null : to + SEG_TAIL;
    this.#seek = from;
    this.#seekAt = performance.now();
    this.#last = { t: from, at: performance.now() };
    this.time = from;
    this.#cmd('seekTo', [from, true]);
    this.#asked();
    this.stuck = false;
    this.#started = false;
    clearTimeout(this.#stuckTimer);
    this.#stuckTimer = setTimeout(() => (this.stuck = !this.#started && this.state !== 'error'), STUCK_MS);
  }

  /** Seek to `t` s, playing on if it was (a segment's stop let go). */
  seek(t: number): void {
    const to = Math.max(0, this.duration ? Math.min(t, this.duration) : t);
    this.#stopAt = null;
    this.#seek = to;
    this.#seekAt = performance.now();
    this.#last = { t: to, at: performance.now() };
    this.time = Math.round(to * 10) / 10;
    this.#cmd('seekTo', [to, true]);
  }

  /** Play on from where it stopped. */
  resume(): void {
    this.#stopAt = null;
    this.#asked();
  }

  /** A play asked. */
  #asked(): void {
    this.#jaTried = false;
    this.#cmd('playVideo');
  }

  /** The speed (one the frame offers). */
  setRate(r: number): void {
    this.rate = r;
    this.#cmd('setPlaybackRate', [r]);
  }

  /** The captions' size, at once when they're on (and each time they load: #captionsNow). */
  setCcSize(n: CcSize): void {
    this.ccSize = n;
    if (this.captions !== 'off') this.#cmd('setOption', ['captions', 'fontSize', n]);
  }

  /** YouTube's captions off, English or Japanese, at once (and at ready and each play after: #captionsNow). */
  setCaptions(mode: CcMode): void {
    this.captions = mode;
    this.#captionsNow();
  }

  pause(): void {
    this.#stopAt = null;
    this.#cmd('pauseVideo');
  }

  /** Load the embed again (after an error or offline). */
  reload(src: string): void {
    this.state = 'loading';
    this.error = null;
    this.stuck = false;
    this.#frame.src = src;
  }

  destroy(): void {
    removeEventListener('message', this.#onMessage);
    this.#frame.removeEventListener('load', this.#greet);
    clearInterval(this.#hello);
    clearInterval(this.#tick);
    clearTimeout(this.#stuckTimer);
  }

  /** The time now, s: the last delivery's, plus the time since while playing. */
  now(): number {
    return this.state === 'playing' ? this.#last.t + ((performance.now() - this.#last.at) / 1000) * this.rate : this.#last.t;
  }

  #post(o: object): void {
    this.#frame.contentWindow?.postMessage(JSON.stringify({ ...o, id: 1, channel: 'widget' }), YT_ORIGIN);
  }
  #cmd(func: string, args: unknown[] = []): void {
    this.#post({ event: 'command', func, args });
  }

  /** `listening` every 250 ms until the frame answers (its page may still be loading), for HELLO_MS. */
  #greet = (): void => {
    clearInterval(this.#hello);
    this.#heard = false;
    const t0 = performance.now();
    const say = () => {
      if (this.#heard) return void clearInterval(this.#hello);
      if (performance.now() - t0 > HELLO_MS) {
        clearInterval(this.#hello);
        this.state = 'error';
        return;
      }
      this.#post({ event: 'listening' });
    };
    say();
    this.#hello = setInterval(say, 250);
  };

  /** The time now, extrapolated LEAP_S at most: what the stop and a state change go by. */
  #sure(): number {
    return Math.min(this.now(), this.#last.t + LEAP_S * this.rate);
  }

  #set(st: YtState | null): void {
    if (!st || this.state === 'error') return;
    // the time as it was when the state changed (extrapolation goes on from there)
    this.#last = { t: this.#sure(), at: performance.now() };
    const was = this.state;
    this.state = st;
    if (st === 'playing' || st === 'buffering') (this.stuck = false), (this.#started = true);
    // (each play, not each delivery: the module loaded again and again would flicker)
    if (st === 'playing' && was !== 'playing') this.#captionsNow();
  }

  /** No captions on the video unless asked: listening is the point. cc_load_policy=0 only stops YouTube forcing them; a
   * viewer's own caption setting (YouTube's, or iOS's "Closed Captions + SDH") still turns them on, and the module loads
   * once a video plays, so it's unloaded at ready and at each play. Both module names, as the embed has used each.
   * Asked (`captions`): loaded with the English track, again at each play (the module may only load once it plays).
   * 日本語: the Japanese track when the frame has reported one, else YouTube's auto-translation of the English (the embed
   * may ignore either: then they stay English or off). Their size (字幕の大きさ) each time they load. */
  #captionsNow(): void {
    if (this.captions !== 'off') {
      this.#cmd('loadModule', ['captions']);
      if (this.captions === 'en') this.#cmd('setOption', ['captions', 'track', { languageCode: 'en' }]);
      else if (this.#cc?.tracks?.some(isJa)) this.#cmd('setOption', ['captions', 'track', { languageCode: 'ja' }]);
      else this.#cmd('setOption', ['captions', 'track', { languageCode: 'en', translationLanguage: { languageCode: 'ja' } }]);
      this.#cmd('setOption', ['captions', 'fontSize', this.ccSize]);
      return;
    }
    this.#cmd('unloadModule', ['captions']);
    this.#cmd('unloadModule', ['cc']);
  }

  /** The captions' info a delivery holds, kept; on 日本語, a Japanese track the frame lists is asked for (once a play). */
  #setCaptionsInfo(info: unknown): void {
    const cc = captionsOf(info);
    if (!cc) return;
    this.#cc = { ...this.#cc, ...cc };
    if (this.captions === 'ja' && !this.#jaTried && this.#cc.tracks?.some(isJa) && !isJa(this.#cc.track?.lang)) {
      this.#jaTried = true;
      this.#cmd('setOption', ['captions', 'track', { languageCode: 'ja' }]);
      this.#cmd('setOption', ['captions', 'fontSize', this.ccSize]);
    }
  }

  #onMessage = (e: MessageEvent): void => {
    if (e.origin !== YT_ORIGIN || e.source !== this.#frame.contentWindow) return;
    const m = readMessage(e.data);
    if (!m) return;
    this.#heard = true;
    const info = m.info as Record<string, unknown> | number | null | undefined;
    switch (m.event) {
      case 'onReady':
        if (this.state === 'loading') this.state = 'ready';
        this.#cmd('addEventListener', ['onStateChange']);
        this.#cmd('addEventListener', ['onError']);
        this.#cmd('addEventListener', ['onApiChange']);
        this.#captionsNow();
        break;
      case 'initialDelivery':
      case 'infoDelivery': {
        if (!info || typeof info !== 'object') break;
        if (typeof info.playerState === 'number') this.#set(stateOf(info.playerState));
        if (typeof info.duration === 'number' && info.duration > 0) this.duration = info.duration;
        if (Array.isArray(info.availablePlaybackRates)) this.rates = info.availablePlaybackRates.filter((r): r is number => typeof r === 'number');
        if (typeof info.playbackRate === 'number') this.rate = info.playbackRate;
        this.#setCaptionsInfo(info);
        const t = info.currentTime;
        if (typeof t === 'number' && Number.isFinite(t)) {
          if (this.#seek !== null && Math.abs(t - this.#seek) > 2 && performance.now() - this.#seekAt < SEEK_MS) break; // (the time from before the seek)
          this.#seek = null;
          this.#last = { t, at: performance.now() };
        }
        break;
      }
      case 'onStateChange':
        this.#set(stateOf(info));
        break;
      case 'apiInfoDelivery':
        this.#setCaptionsInfo(info);
        break;
      case 'onError':
        this.state = 'error';
        this.error = typeof info === 'number' ? info : null;
        this.#stopAt = null;
        break;
    }
  };

  #check = (): void => {
    const t = this.now();
    if (Math.abs(t - this.time) >= 0.1) this.time = Math.round(t * 10) / 10;
    if (this.#stopAt !== null && this.#seek === null && this.state === 'playing' && this.#sure() >= this.#stopAt) this.pause();
  };
}
