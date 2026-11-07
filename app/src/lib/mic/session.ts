// The mic session (docs/kikimimi-mic.md §3.7, §5): one take at a time, from a tap to its end. A take opens the mic on
// the voice's context with the audio session 'play-and-record' (sound.svelte.ts micSession: the music held ducked) and
// ends on the first of: the caller's stop() (the speech kept) or cancel(), the VAD's silence after speech, the cap
// (MAX_S), no speech within WAIT_S, a new take, the app hidden or the page hidden (pagehide). Each end releases the
// track and puts the session back. The speech goes to `done` and nowhere else: never stored, logged or sent here; the
// caller drops it with its round.
import { audioCtx, micSession } from '#lib/sound/sound.svelte.ts';
import { openMic, type Mic } from './capture.ts';
import { SR, type VadState } from './vad.ts';

export { micAllowed } from './capture.ts';

export const MAX_S = 15, WAIT_S = 8;

/** A take's speech: 16 kHz mono PCM, its seconds. */
export interface Got {
  pcm: Float32Array;
  s: number;
  /** When it began, on the audio context's clock (s), where the capture knows it. */
  at?: number;
}
export interface Take {
  /** The take's end: the speech, or null (none heard, cancelled, the app hidden). */
  readonly done: Promise<Got | null>;
  stop(): void;
  cancel(): void;
}
export interface TakeOpts {
  maxS?: number;
  /** Each frame's VAD state (the level meter). */
  frame?: (v: VadState) => void;
}

/** What a take needs from the page (the unit tests give fakes). */
export interface Deps {
  ctx(): AudioContext | null;
  session(on: boolean): void;
  open(ctx: AudioContext, o: { maxS: number; frame: (v: VadState) => void }): Promise<Mic>;
  /** Listen for the page's pagehide or the document's visibilitychange; returns the removal. */
  on(type: 'pagehide' | 'visibilitychange', f: () => void): () => void;
  hidden(): boolean;
  timer(f: () => void, ms: number): () => void;
}

/** The take function over `d`. A take rejects when the mic can't open (its DOMException: NotAllowedError refused). */
export function takes(d: Deps): (o?: TakeOpts) => Promise<Take> {
  let current: ((keep: boolean) => void) | null = null;
  return async (o = {}) => {
    current?.(false);
    // first, still inside the tap: the context made or woken
    const ctx = d.hidden() ? null : d.ctx();
    if (!ctx) throw new DOMException('no audio', 'NotSupportedError');
    const maxS = o.maxS ?? MAX_S;
    let mic: Mic | null = null, over = false, finish!: (g: Got | null) => void;
    const done = new Promise<Got | null>((r) => (finish = r));
    const offs: (() => void)[] = [];
    const end = (keep: boolean) => {
      if (over) return;
      over = true;
      if (current === end) current = null;
      for (const off of offs) off();
      const m = mic, pcm = m?.stop() ?? null, at = m?.at;
      mic = null;
      d.session(false);
      finish(keep && pcm ? { pcm, s: pcm.length / SR, ...(at !== undefined && Number.isFinite(at) && { at }) } : null);
    };
    current = end;
    d.session(true);
    offs.push(d.on('pagehide', () => end(false)), d.on('visibilitychange', () => d.hidden() && end(false)));
    let opened: Mic;
    try {
      opened = await d.open(ctx, { maxS, frame: (v) => (o.frame?.(v), (v.done || mic?.full) && end(true)) });
    } catch (e) {
      end(false);
      throw e;
    }
    // ended while the mic was opening (hidden, a new take): let it go at once
    if (over) opened.stop();
    else {
      mic = opened;
      offs.push(d.timer(() => end(true), maxS * 1000), d.timer(() => mic?.vad.heard || end(false), WAIT_S * 1000));
    }
    return { done, stop: () => end(true), cancel: () => end(false) };
  };
}

/** A take on this page (inside a tap). */
export const takeMic = takes({
  ctx: audioCtx,
  session: micSession,
  open: openMic,
  on(type, f) {
    const at = type === 'pagehide' ? window : document;
    at.addEventListener(type, f);
    return () => at.removeEventListener(type, f);
  },
  hidden: () => document.visibilityState === 'hidden',
  timer(f, ms) {
    const id = setTimeout(f, ms);
    return () => clearTimeout(id);
  }
});
