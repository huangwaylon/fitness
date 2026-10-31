// The sound catalogue (docs/design.md#cues): every sound the app can make, its bus and how it is mixed.
// Ids name the SOUND (a coin clink), not the moment (cues.ts maps app moments to these). A file listed for an id in
// static/audio/manifest.json replaces its procedural placeholder (synth.ts) with no code change.

/** Mixer buses: music and ambience (ミュージック), effects (効果音), dialogue blips (おしゃべり). */
export type Bus = 'music' | 'sfx' | 'voice';

export type SoundId =
  // UI (NookPhone and menus)
  | 'cursor' | 'confirm' | 'cancel' | 'phone-open' | 'phone-close' | 'phone-app'
  // UI taps (docs/design.md#taps): a soft select, the switch pair, keypad keys, a page, the "can't" boop, sync, remove, undo
  | 'select' | 'toggle-on' | 'toggle-off' | 'key' | 'page' | 'boop' | 'whoosh' | 'poof' | 'undo'
  // dialogue text blips (NH: Animalese; しずえ has her own higher voice)
  | 'blip-host' | 'blip-villager'
  // island actions and money
  | 'rustle' | 'thud' | 'coin' | 'bells' | 'purchase'
  // jingles (duck the music, one at a time)
  | 'fanfare' | 'miles' | 'chime'
  // villager reactions (the sound under an emote bubble)
  | 'pop' | 'surprise' | 'heart' | 'sparkle' | 'oops'
  // scenery taps (docs/design.md#scene-interactions): quiet, jittered, two at most
  | 'swish' | 'puff' | 'twinkle' | 'splash' | 'step-sand' | 'step-grass' | 'step-snow' | 'squeak';

/** What a scenery tap asks to sound like (island/sceneTaps.ts sceneSfx → the `scene-<kind>` cue in cues.ts). */
export type SceneSfx =
  | 'bush' | 'flower' | 'cloud' | 'sun' | 'moon' | 'star' | 'shooting-star'
  | 'splash' | 'fish' | 'sand' | 'grass' | 'snow' | 'balloon' | 'butterfly';

interface SoundDef {
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
  // taps: heard dozens of times a day, so under the confirm; the keypad the softest of all
  select: { bus: 'sfx', gain: 0.38, jitter: 20, max: 1 },
  'toggle-on': { bus: 'sfx', gain: 0.4, jitter: 0, max: 1 },
  'toggle-off': { bus: 'sfx', gain: 0.36, jitter: 0, max: 1 },
  key: { bus: 'sfx', gain: 0.26, jitter: 45, max: 2 },
  page: { bus: 'sfx', gain: 0.24, jitter: 60, max: 1 },
  boop: { bus: 'sfx', gain: 0.4, jitter: 0, max: 1 },
  whoosh: { bus: 'sfx', gain: 0.38, jitter: 30, max: 1 },
  poof: { bus: 'sfx', gain: 0.42, jitter: 40, max: 1 },
  undo: { bus: 'sfx', gain: 0.45, jitter: 0, max: 1 },
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
  sparkle: { bus: 'sfx', gain: 0.45, jitter: 30, max: 2 },
  oops: { bus: 'sfx', gain: 0.5, jitter: 0, max: 1 },
  swish: { bus: 'sfx', gain: 0.35, jitter: 80, max: 2 },
  puff: { bus: 'sfx', gain: 0.4, jitter: 60, max: 2 },
  // NH's shooting-star "shiing": not a jingle (it must not duck the music)
  twinkle: { bus: 'sfx', gain: 0.4, jitter: 30, max: 2 },
  splash: { bus: 'sfx', gain: 0.45, jitter: 70, max: 2 },
  'step-sand': { bus: 'sfx', gain: 0.4, jitter: 90, max: 2 },
  'step-grass': { bus: 'sfx', gain: 0.35, jitter: 90, max: 2 },
  'step-snow': { bus: 'sfx', gain: 0.4, jitter: 90, max: 2 },
  squeak: { bus: 'sfx', gain: 0.4, jitter: 50, max: 2 }
};

export const SOUND_IDS = Object.keys(SOUNDS) as SoundId[];

export const isSoundId = (s: string): s is SoundId => Object.hasOwn(SOUNDS, s);
