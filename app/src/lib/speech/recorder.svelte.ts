// One take's recording session, for the speech test's page (routes/speech) and すごろく's speaking step (SpeakStep): the
// mic asked for in the tap (stt.ts record, guarded: taps while its permission is pending are let be), the seconds
// counted, an automatic stop at MAX_S, and everything let go of when the screen goes (`close`: the mic, the timer and
// any upload under `signal`). The callers keep their own screens; the audio session (sound.svelte.ts micFocus) is
// theirs, as each holds it differently.
import { MAX_S, record, type Pcm, type Refused, type Take } from './stt.ts';

export class Recorder {
  /** `ask`: the mic's permission pending; `rec`: recording; `wait`: stopped, the caller's upload under way. */
  phase = $state<'idle' | 'ask' | 'rec' | 'wait'>('idle');
  /** The take's seconds so far. */
  secs = $state(0);
  #take: Take | null = null;
  #timer: ReturnType<typeof setInterval> | undefined;
  #abort = new AbortController();
  #onmax: () => void;

  /** `onmax`: MAX_S reached (the caller stops the take, as a tap on 止める would). */
  constructor(onmax: () => void) {
    this.#onmax = onmax;
  }

  /** Aborted once the screen has gone: the caller's uploads pass it. */
  get signal(): AbortSignal {
    return this.#abort.signal;
  }

  /** The mic opened and recording (`true`), refused (why), or nothing done (`null`: already asking or recording, or the
   *  screen left meanwhile). Call it in the tap. */
  async start(): Promise<true | Refused | null> {
    if (this.phase !== 'idle') return null;
    this.phase = 'ask';
    const t = await record(this.#abort.signal);
    if (this.#abort.signal.aborted) return null;
    if ('miss' in t) {
      this.phase = 'idle';
      return t;
    }
    this.#take = t;
    this.phase = 'rec';
    this.secs = 0;
    const t0 = performance.now();
    this.#timer = setInterval(() => {
      this.secs = (performance.now() - t0) / 1000;
      if (this.secs >= MAX_S) this.#onmax();
    }, 100);
    return true;
  }

  /** The take ended: its samples and when it was stopped (for the times), or null (none recording). The phase stays
   *  `wait` until `idle()`. */
  async stop(): Promise<{ pcm: Pcm; t0: number } | null> {
    const t = this.#take;
    if (!t || this.phase !== 'rec') return null;
    clearInterval(this.#timer);
    this.#take = null;
    this.phase = 'wait';
    const t0 = performance.now();
    return { pcm: await t.stop(), t0 };
  }

  /** Ready for the next take. */
  idle(): void {
    this.phase = 'idle';
  }

  /** The take dropped (the mic closed), unsent. */
  cancel(): void {
    clearInterval(this.#timer);
    this.#take?.cancel();
    this.#take = null;
    if (this.phase === 'rec') this.phase = 'idle';
  }

  /** The screen gone: the take dropped, a pending mic closed as it arrives, uploads aborted. */
  close(): void {
    this.cancel();
    this.#abort.abort();
  }
}
