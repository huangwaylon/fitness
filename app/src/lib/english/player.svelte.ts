// YouTube's embed driven over postMessage (docs/english.md "The player"): no iframe_api script (a third-party
// script-src). The frame is told `listening` until it answers; it reports `onReady`, `infoDelivery` (the time, the
// state) and `onError`; it's sent `command`s (seekTo, playVideo, pauseVideo). A segment pauses at its end: the time
// between deliveries is extrapolated, checked every 100 ms. A play that doesn't start (iOS wants a tap on the video
// itself the first time) says so (`stuck`).

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

/** No answer to `listening` in this long: the embed is unavailable (blocked, or the network gave out). */
const HELLO_MS = 12_000;
/** A play asked this long ago that hasn't started: `stuck`. */
const STUCK_MS = 2_500;

export class YtPlayer {
  state = $state<YtState>('loading');
  /** The time now, s (about: extrapolated while playing). */
  time = $state(0);
  /** YouTube's error code (100 gone, 101/150 not embeddable, 153 no referrer…), null for no answer at all. */
  error = $state<number | null>(null);
  /** A play was asked and nothing started. */
  stuck = $state(false);

  #frame: HTMLIFrameElement;
  #last = { t: 0, at: 0 };
  #stopAt: number | null = null;
  /** A seek on its way: deliveries' times ignored until one is near it. */
  #seek: number | null = null;
  #heard = false;
  /** The last play asked has started (playing or buffering since). */
  #started = true;
  #hello: ReturnType<typeof setInterval> | undefined;
  #tick: ReturnType<typeof setInterval>;
  #stuckTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(frame: HTMLIFrameElement) {
    this.#frame = frame;
    addEventListener('message', this.#onMessage);
    frame.addEventListener('load', this.#greet);
    this.#greet();
    this.#tick = setInterval(this.#check, 100);
  }

  /** Play from `from` s, pausing at `to` (null: to the end). */
  play(from: number, to: number | null): void {
    this.#stopAt = to;
    this.#seek = from;
    this.#last = { t: from, at: performance.now() };
    this.time = from;
    this.#cmd('seekTo', [from, true]);
    this.#cmd('playVideo');
    this.stuck = false;
    this.#started = false;
    clearTimeout(this.#stuckTimer);
    this.#stuckTimer = setTimeout(() => (this.stuck = !this.#started && this.state !== 'error'), STUCK_MS);
  }

  pause(): void {
    this.#stopAt = null;
    this.#cmd('pauseVideo');
  }

  /** Load the embed again (after an error or offline). */
  reload(src: string): void {
    this.state = 'loading';
    this.error = null;
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
    return this.state === 'playing' ? this.#last.t + (performance.now() - this.#last.at) / 1000 : this.#last.t;
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

  #set(st: YtState | null): void {
    if (!st || this.state === 'error') return;
    // the time as it was when the state changed (extrapolation goes on from there)
    this.#last = { t: this.now(), at: performance.now() };
    this.state = st;
    if (st === 'playing' || st === 'buffering') (this.stuck = false), (this.#started = true);
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
        break;
      case 'initialDelivery':
      case 'infoDelivery': {
        if (!info || typeof info !== 'object') break;
        if (typeof info.playerState === 'number') this.#set(stateOf(info.playerState));
        const t = info.currentTime;
        if (typeof t === 'number' && Number.isFinite(t)) {
          if (this.#seek !== null && Math.abs(t - this.#seek) > 2) break; // (the time from before the seek)
          this.#seek = null;
          this.#last = { t, at: performance.now() };
        }
        break;
      }
      case 'onStateChange':
        this.#set(stateOf(info));
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
    if (this.#stopAt !== null && this.#seek === null && this.state === 'playing' && t >= this.#stopAt) this.pause();
  };
}
