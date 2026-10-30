// The one place app moments meet sounds (docs/design/sound.md §5, the mapping table). Components and the motion
// director call cue('…') at the moment; what it sounds like (and how loud, how late) is decided here, so the mix can
// be tuned without touching a component. Villager reactions name their cue in the reaction catalogue
// (motion/reactions.ts `cue`), and the director plays it with the step.
import type { SceneSfx, SoundId } from './ids.ts';
import { semitones } from './mix.ts';
import { covered, play } from './sound.svelte.ts';

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
  | 'buy' | 'badge-met' | 'harvest-receive'
  // scenery taps (island/sceneTaps.ts sceneSfx)
  | `scene-${SceneSfx}`;

interface CueDef {
  sound: SoundId;
  /** A sound of the island itself: silent while a sheet, the phone or the harvest covers the scene (NH's world goes
   *  quiet under its menus; round 14 review R1). UI cues always play. */
  world?: boolean;
  /** Level on top of the sound's own (1 = as defined in ids.ts). */
  gain?: number;
  /** Seconds after the call (to land on an animation's beat). */
  delay?: number;
  /** Semitones up (down if negative) from the sound's own pitch. */
  step?: number;
}

export const CUES: Record<Cue, CueDef> = {
  'tree-shake': { sound: 'rustle', world: true },
  // fruit-drop keyframes: the item hits the ground at 55% of 520 ms
  'fruit-land': { sound: 'thud', delay: 0.29, world: true },
  'coin-land': { sound: 'coin', world: true },
  'bells-arrive': { sound: 'bells', world: true },
  'jar-tap': { sound: 'pop', gain: 0.6 },
  'villager-tap': { sound: 'pop' },
  'host-tap': { sound: 'pop', gain: 0.8 },
  'emote-surprise': { sound: 'surprise', world: true },
  'emote-love': { sound: 'heart', world: true },
  'emote-joy': { sound: 'sparkle', world: true },
  'emote-idea': { sound: 'pop', gain: 0.8, world: true },
  trouble: { sound: 'oops', world: true },
  announce: { sound: 'chime', world: true },
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
  'harvest-receive': { sound: 'fanfare' },
  // scenery (scene-interactions.md §Sound): quiet world sounds, muted under a sheet like the rest of the island
  'scene-bush': { sound: 'rustle', gain: 0.7, world: true },
  'scene-flower': { sound: 'swish', world: true },
  'scene-butterfly': { sound: 'sparkle', gain: 0.3, step: 7, world: true },
  'scene-cloud': { sound: 'puff', world: true },
  'scene-sun': { sound: 'sparkle', gain: 0.5, world: true },
  'scene-moon': { sound: 'sparkle', gain: 0.4, step: -3, world: true },
  'scene-star': { sound: 'sparkle', gain: 0.3, step: 12, world: true },
  'scene-shooting-star': { sound: 'twinkle', world: true },
  'scene-splash': { sound: 'splash', world: true },
  'scene-fish': { sound: 'splash', gain: 0.6, step: -4, world: true },
  'scene-sand': { sound: 'step-sand', world: true },
  'scene-grass': { sound: 'step-grass', world: true },
  'scene-snow': { sound: 'step-snow', world: true },
  'scene-balloon': { sound: 'squeak', world: true }
};

/** A run of coins climbs this major pentatonic (semitones), one note per coin across the whole batch, then holds the
 *  top: one rising gesture instead of the same three notes again and again (round 14 review R2). */
const COIN_RUN = [0, 2, 4, 7, 9, 12, 14, 16, 19] as const;
export const coinStep = (n: number): number => COIN_RUN[Math.min(Math.max(0, n), COIN_RUN.length - 1)];

/** Play a moment's sound. `step`: semitones up; `gain`: × the cue's level; `delay`: extra seconds. */
export function cue(c: Cue, o: { step?: number; gain?: number; delay?: number } = {}): void {
  const d = CUES[c];
  if (d.world && covered()) return;
  const step = (d.step ?? 0) + (o.step ?? 0);
  play(d.sound, { gain: (d.gain ?? 1) * (o.gain ?? 1), delay: (d.delay ?? 0) + (o.delay ?? 0), rate: step ? semitones(step) : undefined });
}
