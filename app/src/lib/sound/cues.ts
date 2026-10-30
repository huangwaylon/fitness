// The one place app moments meet sounds (docs/design/sound.md §5, the mapping table). Components and the motion
// director call cue('…') at the moment; what it sounds like (and how loud, how late) is decided here, so the mix can
// be tuned without touching a component. Villager reactions name their cue in the reaction catalogue
// (motion/reactions.ts `cue`), and the director plays it with the step.
import type { SoundId } from './ids.ts';
import { semitones } from './mix.ts';
import { play } from './sound.svelte.ts';

export type Cue =
  // the island
  | 'tree-shake' | 'fruit-land' | 'coin-land' | 'bells-arrive' | 'jar-tap'
  // villagers and しずえ (reaction steps)
  | 'villager-tap' | 'host-tap' | 'emote-surprise' | 'emote-love' | 'emote-joy' | 'emote-idea' | 'trouble' | 'announce'
  // check-in, choices, toggles
  | 'checkin-saved' | 'choice-move' | 'choice-pick' | 'toggle'
  // the しまフォン
  | 'phone-open' | 'phone-close' | 'phone-app' | 'back'
  // money and the harvest
  | 'buy' | 'badge-met' | 'harvest-receive';

interface CueDef {
  sound: SoundId;
  /** Level on top of the sound's own (1 = as defined in ids.ts). */
  gain?: number;
  /** Seconds after the call (to land on an animation's beat). */
  delay?: number;
}

export const CUES: Record<Cue, CueDef> = {
  'tree-shake': { sound: 'rustle' },
  // fruit-drop keyframes: the item hits the ground at 55% of 520 ms
  'fruit-land': { sound: 'thud', delay: 0.29 },
  'coin-land': { sound: 'coin' },
  'bells-arrive': { sound: 'bells' },
  'jar-tap': { sound: 'pop', gain: 0.6 },
  'villager-tap': { sound: 'pop' },
  'host-tap': { sound: 'pop', gain: 0.8 },
  'emote-surprise': { sound: 'surprise' },
  'emote-love': { sound: 'heart' },
  'emote-joy': { sound: 'sparkle' },
  'emote-idea': { sound: 'pop', gain: 0.8 },
  trouble: { sound: 'oops' },
  announce: { sound: 'chime' },
  'checkin-saved': { sound: 'confirm' },
  'choice-move': { sound: 'cursor' },
  'choice-pick': { sound: 'confirm' },
  toggle: { sound: 'cursor' },
  'phone-open': { sound: 'phone-open' },
  'phone-close': { sound: 'phone-close' },
  'phone-app': { sound: 'phone-app' },
  back: { sound: 'cancel' },
  buy: { sound: 'purchase' },
  'badge-met': { sound: 'miles' },
  'harvest-receive': { sound: 'fanfare' }
};

/** Play a moment's sound. `step`: semitones up (a run of coins climbs); `delay`: extra seconds. */
export function cue(c: Cue, o: { step?: number; delay?: number } = {}): void {
  const d = CUES[c];
  play(d.sound, { gain: d.gain, delay: (d.delay ?? 0) + (o.delay ?? 0), rate: o.step ? semitones(o.step) : undefined });
}
