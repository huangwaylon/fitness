// Mix rules (docs/design.md#mix), pure so they can be tested without an AudioContext: the voice limit, the
// pitch jitter and the music duck under a jingle.
import { SOUNDS, type SoundId } from './ids.ts';

/** Bus levels at full volume (engine.ts). NH's BGM is gentle and sits well under the effects; blips are quiet.
 *  scripts/music.ts reads `music` for the tracks' true-peak ceiling. */
export const LEVELS = { music: 0.3, ambient: 0.28, sfx: 0.9, voice: 0.4 } as const;

/** At most this many effects and blips sound at once (NH stays sparse: one or two things at a time). */
export const MAX_VOICES = 6;

interface Voice {
  key: number;
  id: SoundId;
  /** Start and end, in seconds on the audio clock. */
  at: number;
  until: number;
}

type Admit = { ok: false } | { ok: true; key: number; stop: number[] };

/** Who may sound now. Per id: at most `max` (the oldest of that id is stopped). A jingle while another jingle plays is
 *  dropped (a second fanfare on top of the first is noise). Over the total: the oldest non-jingle voice is stopped;
 *  if every voice is a jingle, the newcomer is dropped. */
export class VoiceLimiter {
  #voices: Voice[] = [];
  #n = 0;
  readonly limit: number;
  constructor(limit = MAX_VOICES) {
    this.limit = limit; // a plain field: scripts/music.ts imports this file under Node's type stripping
  }

  admit(id: SoundId, now: number, duration: number, at = now): Admit {
    this.#voices = this.#voices.filter((v) => v.until > now);
    const def = SOUNDS[id];
    const stop: number[] = [];
    const kick = (v: Voice) => {
      stop.push(v.key);
      this.#voices = this.#voices.filter((x) => x !== v);
    };
    if (def.jingle && this.#voices.some((v) => SOUNDS[v.id].jingle)) return { ok: false };
    const same = this.#voices.filter((v) => v.id === id);
    for (let i = 0; i <= same.length - def.max; i++) kick(same[i]);
    while (this.#voices.length >= this.limit) {
      const victim = this.#voices.find((v) => !SOUNDS[v.id].jingle);
      if (!victim) return { ok: false };
      kick(victim);
    }
    const key = ++this.#n;
    this.#voices.push({ key, id, at, until: at + duration });
    return { ok: true, key, stop };
  }

  /** A voice ended or was cancelled early. */
  release(key: number): void {
    this.#voices = this.#voices.filter((v) => v.key !== key);
  }

  active(now: number): Voice[] {
    return this.#voices.filter((v) => v.until > now);
  }

  /** A jingle is sounding (the music stays ducked). */
  jingleUntil(now: number): number {
    return Math.max(now, ...this.active(now).filter((v) => SOUNDS[v.id].jingle).map((v) => v.until));
  }
}

/** Playback rate for ± `cents` of random detune (100 cents = a semitone). */
export function jitterRate(cents: number, rng: () => number = Math.random): number {
  if (!cents) return 1;
  return 2 ** (((rng() * 2 - 1) * cents) / 1200);
}

/** Playback rate `semitones` up (a coin run climbs). */
export const semitones = (n: number): number => 2 ** (n / 12);

/** Music under a jingle (NH dips the BGM for the item-get fanfare and brings it back after). */
const DUCK = { depth: 0.25, attack: 0.12, release: 0.8 } as const;

/** Gain points (time in s on the audio clock → music duck gain) for a jingle from `at` to `until`. */
export function duckPlan(at: number, until: number, d: { depth: number; attack: number; release: number } = DUCK): { t: number; gain: number }[] {
  return [
    { t: at, gain: 1 },
    { t: at + d.attack, gain: d.depth },
    { t: Math.max(at + d.attack, until), gain: d.depth },
    { t: Math.max(at + d.attack, until) + d.release, gain: 1 }
  ];
}
