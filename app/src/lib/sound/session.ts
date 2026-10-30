// The rules the engine follows around iOS's audio session and the AudioContext's life (docs/design/sound.md §11),
// pure so they can be tested without an AudioContext: which session type, when a tap is needed, when a cue may
// sound, when to let the hardware sleep, when a deck needs its fade-in, and the wrap hand-off's timing.

/** `navigator.audioSession.type`: 'playback' plays through the Ring/Silent switch and stops other apps' audio (the
 *  user asked for the music to play in silent mode); 'ambient' mixes with their audio and follows the switch. */
export type SessionType = 'playback' | 'ambient';

/** Only ミュージック takes the 'playback' session (round 16, option A): effects and voices alone are 'ambient'. */
export const sessionType = (music: boolean): SessionType => (music ? 'playback' : 'ambient');

/** Leaving 'playback' waits until the music's fade-out (0.6 s) is over, so the category never changes under audio
 *  that is still sounding. */
export const SESSION_RELEASE_MS = 800;

type Timers = { set: (f: () => void, ms: number) => unknown; clear: (id: unknown) => void };
const TIMERS: Timers = { set: (f, ms) => setTimeout(f, ms), clear: (id) => clearTimeout(id as ReturnType<typeof setTimeout>) };

/**
 * Switches the session type in a safe order. WebKit applies the type when audio next starts, so 'playback' is set at
 * once (inside the tap, before the context or a music deck starts); going back to 'ambient' waits for the music to
 * fade, and is dropped if the music comes back on meanwhile.
 */
export class SessionSwitch {
  current: SessionType | null = null;
  #pending: unknown = null;
  #apply: (t: SessionType) => void;
  #timers: Timers;
  constructor(apply: (t: SessionType) => void, timers: Timers = TIMERS) {
    this.#apply = apply;
    this.#timers = timers;
  }

  /** `now`: no audio is running yet (before the context exists), so even 'ambient' applies at once. */
  want(music: boolean, now = false): void {
    const t = sessionType(music);
    if (this.#pending !== null) this.#timers.clear(this.#pending);
    this.#pending = null;
    if (t === this.current) return;
    if (t === 'playback' || now || this.current === null) return this.#set(t);
    this.#pending = this.#timers.set(() => {
      this.#pending = null;
      this.#set(t);
    }, SESSION_RELEASE_MS);
  }

  #set(t: SessionType): void {
    this.current = t;
    this.#apply(t);
  }
}

/** A `resume()` started in a tap counts as running for this long, so the tap's own sound plays. Not longer: in
 *  WebKit a resume() during an interruption (a call, Siri) stays pending until it ends, and cues let through
 *  meanwhile would all burst out together then. */
export const RESUME_WINDOW_MS = 250;

/** May a cue be scheduled now? `state` is the context's (WebKit adds 'interrupted', outside the TS union). */
export const canSound = (state: string, msSinceResume: number): boolean =>
  state === 'running' || (state === 'suspended' && msSinceResume >= 0 && msSinceResume < RESUME_WINDOW_MS);

/** A cue scheduled inside the resume window is stopped if the context still isn't running this long after (the
 *  resume was refused or is held by an interruption): nothing waits to burst out later. */
export const QUEUED_DROP_MS = 300;

/** Waiting for a tap: no context, a context that isn't running, or (with music on) decks that were never unlocked
 *  in a gesture, or a current track that something outside the app paused (Control Center, AirPods out, Siri). */
export function needsUnlock(s: { state: string | null; music: boolean; decksReady: boolean; frontStalled: boolean }): boolean {
  return s.state !== 'running' || (s.music && (!s.decksReady || s.frontStalled));
}

/** The gestures the app listens to (document, capture). On a touch screen a tap is pointerdown → pointerup →
 *  touchend, and **click only on an element with a click handler** (iOS fires no click on plain scenery): so no
 *  part of the unlock may depend on the click. pointerdown isn't a user activation on a touch screen; pointerup
 *  (touch) and touchend are (HTML's activation-triggering events), and so are click and keydown. */
export type Gesture = 'pointerdown' | 'pointerup' | 'touchend' | 'click' | 'keydown';

/** What a gesture does: nothing; `context` (create / resume the AudioContext only, so a sound fired on pointerdown
 *  can be scheduled); or `full`: the context, the decks unlocked inside the gesture, and a current track that isn't
 *  playing started inside it too. Every activation that finds anything still waiting does the full unlock, so the
 *  first tap anywhere starts the music, and a play() the browser refused is retried by the very next tap. */
export function gestureAction(g: Gesture, s: Parameters<typeof needsUnlock>[0]): 'none' | 'context' | 'full' {
  if (!needsUnlock(s)) return 'none';
  if (g === 'pointerdown') return s.state === 'running' ? 'none' : 'context';
  return 'full';
}

/** With only 効果音 / おしゃべり on, the context is suspended after this long without a sound (an open context keeps
 *  the audio hardware awake), and the next cue resumes it. */
export const IDLE_SUSPEND_MS = 10_000;

/** A restartable one-shot timer: `poke()` after every sound, `onIdle` runs IDLE_SUSPEND_MS after the last one. */
export class IdleTimer {
  #id: unknown = null;
  #onIdle: () => void;
  #ms: number;
  #timers: Timers;
  constructor(onIdle: () => void, ms = IDLE_SUSPEND_MS, timers: Timers = TIMERS) {
    this.#onIdle = onIdle;
    this.#ms = ms;
    this.#timers = timers;
  }

  poke(): void {
    this.cancel();
    this.#id = this.#timers.set(() => {
      this.#id = null;
      this.#onIdle();
    }, this.#ms);
  }

  cancel(): void {
    if (this.#id !== null) this.#timers.clear(this.#id);
    this.#id = null;
  }

  get armed(): boolean {
    return this.#id !== null;
  }
}

/** The deck meant to sound is not audibly up: paused, or playing at under half its level (iOS played it from the
 *  lock screen while the page was hidden, so its gain is still the 0 that pause() left). Fade it in. */
export const needsFadeIn = (paused: boolean, gain: number, level: number): boolean => paused || gain < level * 0.5;

/** The wrap hand-off (tracks with an `end`: one loop period plus a copy of its first seconds, scripts/music.ts). The
 *  other deck is readied this long before the period ends, starts once the playing deck is this far into the copy,
 *  lines up within `tolerance`, then takes over with a `fade` crossfade. Both decks play the same samples there, so
 *  there is no seek at the seam and no gap (WebKit's `<audio loop>` seeks to 0 at the end, which can drop out). */
export const WRAP = { prep: 4, into: 0.12, tolerance: 0.012, tries: 4, fade: 0.15 } as const;

/** Where the incoming deck should be, given the outgoing deck's position past the period's end. Null: not in the
 *  copied tail (yet, or any more). */
export function wrapTarget(pos: number, end: number, tail: number): number | null {
  const into = pos - end;
  return into >= 0 && into < tail ? into : null;
}
