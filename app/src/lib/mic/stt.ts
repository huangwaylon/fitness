// ききみみ's recogniser (docs/kikimimi-mic.md §3.2): one interface over the backends, so swapping one changes no game.
// - whisper: on the phone, in a Worker (WebGPU, else the WASM runtime); the only one 自動 uses;
// - webkit: Safari's own recogniser (the audio may go to Apple), only when picked by hand in せってい;
// - relay: our relay's `/stt` (Workers AI; nothing kept), only when picked by hand;
// - stub: the tests' (its script: pick.ts stubScript), inert without it.
// recogniser() gives this phone's (the mic on, the choice in せってい, what can run here), its backend loaded lazily;
// one recogniser at a time, one take at a time. A take is started inside a tap and ends on stop, cancel, the VAD's
// silence, its cap or the app hiding (session.ts). The expected sentence is never given to a recogniser: Hint has only
// the take's cap and, for はつおん, the two candidate words. What was heard lives in the caller's round only: never
// stored, logged, sent to the partner, or put into an Error.
import { localKV } from '#lib/sync/storage.ts';
import { pickBackend, readMic, stubbed, type Backend as Picked, type Can } from './pick.ts';
import { takeMic, type Got } from './session.ts';
import type { VadState } from './vad.ts';

export type Backend = Picked | 'stub';

export interface Heard {
  /** What was heard ('' in the candidates mode). */
  text: string;
  /** Word times (s), when the backend gives them (the relay). */
  words?: readonly { w: string; t0: number; t1: number }[];
  /** Per candidate, a score (the mean token log-probability: whisper's candidates mode only). */
  cand?: readonly number[];
  /** The recognition's ms (after the take ended). */
  ms: number;
  be: Backend;
}

/** Why nothing was heard: no speech, cancelled, the mic refused, the relay's day spent (「今日は ここまで」) or switched
 *  off, not paired, the network, a timeout, out of memory, Safari's recogniser not allowed, anything else. */
export type Miss = 'none' | 'aborted' | 'denied' | 'capped' | 'off' | 'unpaired' | 'network' | 'timeout' | 'oom' | 'service-not-allowed' | 'other';
export interface Missed {
  miss: Miss;
  be: Backend;
}
export type Outcome = Heard | Missed;
export const isMiss = (o: Outcome): o is Missed => 'miss' in o;

/** What a take may know: never the expected sentence. */
interface Hint {
  /** The take's cap (s; the relay's is 10 at most). */
  maxS?: number;
  /** はつおん's two words: whisper scores each (Heard.cand); the others transcribe (match.ts candidate reads it). */
  candidates?: readonly string[];
  /** Each capture frame's VAD state (none for Safari's recogniser). */
  frame?: (v: VadState) => void;
}

export interface Take {
  /** The voice's level now, 0–1 (0 with Safari's recogniser). */
  readonly level: number;
  /** What was heard once the take ended; never rejects. */
  readonly heard: Promise<Outcome>;
  /** End the take now (the speech kept): `heard`. */
  stop(): Promise<Outcome>;
  /** Drop it: `heard` is `aborted`, any recognition under way let go. */
  cancel(): void;
}

export interface Recogniser {
  readonly be: Backend;
  /** Ready to listen (whisper: the model downloaded if missing, with `progress` in bytes, and loaded): false if it can't. */
  ready(progress?: (got: number, of: number) => void): Promise<boolean>;
  /** A take (inside a tap). */
  listen(h?: Hint): Take;
  dispose(): void;
}

/** A capture-and-recognise take (whisper, relay, stub): the backends get it from here, so they import no capture. */
export type Capture = (be: Backend, h: Hint, recognise: (got: Got, signal: AbortSignal) => Promise<Outcome>) => Take;

/** A level in dBFS as 0–1 (−60 → −15), the mic button's ring. */
export const level01 = (db: number): number => Math.min(1, Math.max(0, (db + 60) / 45));

/** The take function's shape (session.ts takes; the unit tests give fakes). */
export type TakeFn = typeof takeMic;

/** Capture through `take` (session.ts: the VAD, the cap, hiding), then `recognise` what was kept. */
export function capturing(take: TakeFn): Capture {
  return (be, h, recognise) => {
    const ac = new AbortController();
    let lv = 0, over = false, stopAsked = false, mic: Awaited<ReturnType<TakeFn>> | null = null;
    const aborted = new Promise<Missed>((r) => ac.signal.addEventListener('abort', () => r({ miss: 'aborted', be })));
    const opening = take({ maxS: h.maxS, frame: (v) => ((lv = level01(v.db)), h.frame?.(v)) });
    const run = async (): Promise<Outcome> => {
      try {
        mic = await opening;
      } catch (e) {
        return { miss: e instanceof DOMException && e.name === 'NotAllowedError' ? 'denied' : 'other', be };
      }
      if (ac.signal.aborted) mic.cancel();
      else if (stopAsked) mic.stop();
      const got = await mic.done;
      lv = 0;
      if (ac.signal.aborted) return { miss: 'aborted', be };
      if (!got) return { miss: 'none', be };
      return recognise(got, ac.signal).catch((): Missed => ({ miss: 'other', be }));
    };
    const heard = Promise.race([run(), aborted]).then((o) => ((over = true), (lv = 0), o));
    return {
      get level() {
        return over ? 0 : lv;
      },
      heard,
      stop() {
        stopAsked = true;
        mic?.stop();
        return heard;
      },
      cancel() {
        if (over) return;
        ac.abort();
        // still opening: `run` cancels it once open
        mic?.cancel();
      }
    };
  };
}

// ---- the one recogniser -------------------------------------------------------------------------------------------

let current: Recogniser | null = null;
let live: Take | null = null;

/** A recogniser made to keep one take at a time across all of them: a new take cancels the last. */
function one(r: Recogniser): Recogniser {
  const w: Recogniser = {
    be: r.be,
    ready: (p) => r.ready(p),
    listen(h = {}) {
      live?.cancel();
      const t = (live = r.listen(h));
      void t.heard.then(() => live === t && (live = null));
      return t;
    },
    dispose() {
      live?.cancel();
      live = null;
      r.dispose();
      if (current === w) current = null;
    }
  };
  return w;
}


/** What can run on this phone for a game: whisper's model on the phone (no download in a round), Safari's
 *  recogniser, the relay (paired). */
async function sttCan(): Promise<Can> {
  const [{ whisperCached }, { relayReady }] = await Promise.all([import('./backends/whisper.ts'), import('./backends/relay.ts')]);
  return { whisper: await whisperCached(), webkit: typeof window !== 'undefined' && 'webkitSpeechRecognition' in window, relay: relayReady() };
}

/** The backend this phone would use now (null: the mic off, or none can run: the speech modes stay hidden). */
export async function sttBackend(): Promise<Backend | null> {
  if (stubbed()) return 'stub';
  const p = readMic(localKV());
  return p.on ? pickBackend(p.be, await sttCan()) : null;
}

/** Each backend's maker, loaded when first used. */
const MAKE: Record<Backend, () => Promise<(cap: Capture) => Recogniser>> = {
  whisper: async () => (await import('./backends/whisper.ts')).whisperRecogniser,
  webkit: async () => (await import('./backends/webkit.ts')).webkitRecogniser,
  relay: async () => (await import('./backends/relay.ts')).relayRecogniser,
  stub: async () => (await import('./backends/stub.ts')).stubRecogniser
};

/** This phone's recogniser (`be`: that one, as the probe or a test wants), or null. The last one is reused when it's
 *  the same backend, else disposed: one at a time. Call ready() before the first take; release() when the sheet
 *  closes. */
export async function recogniser(be?: Backend): Promise<Recogniser | null> {
  const want = be ?? (await sttBackend());
  if (!want) return null;
  if (current?.be === want) return current;
  current?.dispose();
  const make = await MAKE[want]();
  // another call may have won meanwhile
  if (current?.be === want) return current;
  current?.dispose();
  return (current = one(make(capturing(takeMic))));
}

/** The recogniser let go (the sheet closed, the app left a mic game): whisper's Worker terminated (iOS memory). */
export function release(): void {
  current?.dispose();
}
