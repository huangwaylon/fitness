// The sound catalogue (docs/design/sound.md §5): every sound the app can make, its bus and how it is mixed.
// Ids name the SOUND (a coin clink), not the moment (cues.ts maps app moments to these). A file listed for an id in
// static/audio/manifest.json replaces its procedural placeholder (synth.ts) with no code change.

/** Mixer buses: music and ambience (ミュージック), effects (効果音), dialogue blips (おしゃべり). */
export type Bus = 'music' | 'sfx' | 'voice';

export type SoundId =
  // UI (NookPhone and menus)
  | 'cursor' | 'confirm' | 'cancel' | 'phone-open' | 'phone-close' | 'phone-app'
  // dialogue text blips (NH: Animalese; しずえ has her own higher voice)
  | 'blip-host' | 'blip-villager'
  // island actions and money
  | 'rustle' | 'thud' | 'coin' | 'bells' | 'purchase'
  // jingles (duck the music, one at a time)
  | 'fanfare' | 'miles' | 'chime'
  // villager reactions (the sound under an emote bubble)
  | 'pop' | 'surprise' | 'heart' | 'sparkle' | 'oops';

export interface SoundDef {
  bus: 'sfx' | 'voice';
  /** Level on its bus, 0–1 (the placeholder renders all peak at the same level; this is the mix). */
  gain: number;
  /** ± cents of random pitch per play (NH never plays a repeated effect at exactly the same pitch). */
  jitter: number;
  /** Voices of this id at once; a new one stops the oldest. */
  max: number;
  /** A jingle: ducks the music under it and never overlaps another jingle (the later one is dropped). */
  jingle?: boolean;
}

// Levels: soft UI ticks well under the island actions, the jingles at the top (they are the rewards), blips quiet.
export const SOUNDS: Record<SoundId, SoundDef> = {
  cursor: { bus: 'sfx', gain: 0.35, jitter: 0, max: 1 },
  confirm: { bus: 'sfx', gain: 0.55, jitter: 0, max: 1 },
  cancel: { bus: 'sfx', gain: 0.5, jitter: 0, max: 1 },
  'phone-open': { bus: 'sfx', gain: 0.55, jitter: 0, max: 1 },
  'phone-close': { bus: 'sfx', gain: 0.5, jitter: 0, max: 1 },
  'phone-app': { bus: 'sfx', gain: 0.5, jitter: 30, max: 1 },
  'blip-host': { bus: 'voice', gain: 0.5, jitter: 0, max: 2 },
  'blip-villager': { bus: 'voice', gain: 0.5, jitter: 0, max: 2 },
  rustle: { bus: 'sfx', gain: 0.6, jitter: 80, max: 2 },
  thud: { bus: 'sfx', gain: 0.7, jitter: 60, max: 2 },
  coin: { bus: 'sfx', gain: 0.4, jitter: 25, max: 3 },
  bells: { bus: 'sfx', gain: 0.55, jitter: 0, max: 1 },
  purchase: { bus: 'sfx', gain: 0.7, jitter: 0, max: 1 },
  fanfare: { bus: 'sfx', gain: 0.75, jitter: 0, max: 1, jingle: true },
  miles: { bus: 'sfx', gain: 0.7, jitter: 0, max: 1, jingle: true },
  chime: { bus: 'sfx', gain: 0.55, jitter: 0, max: 1, jingle: true },
  pop: { bus: 'sfx', gain: 0.45, jitter: 60, max: 2 },
  surprise: { bus: 'sfx', gain: 0.5, jitter: 40, max: 1 },
  heart: { bus: 'sfx', gain: 0.5, jitter: 30, max: 1 },
  sparkle: { bus: 'sfx', gain: 0.45, jitter: 30, max: 1 },
  oops: { bus: 'sfx', gain: 0.5, jitter: 0, max: 1 }
};

export const SOUND_IDS = Object.keys(SOUNDS) as SoundId[];

export const isSoundId = (s: string): s is SoundId => Object.hasOwn(SOUNDS, s);
