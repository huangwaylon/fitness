// The sound catalogue (docs/design.md#cues): every sound the app can make, its bus and how it is mixed.
// Ids name the SOUND (a coin clink), not the moment (cues.ts maps app moments to these). A file listed for an id in
// static/audio/manifest.json replaces its procedural placeholder (synth.ts) with no code change.

/** Mixer buses: music and ambience (ミュージック), effects (効果音). */
export type Bus = 'music' | 'sfx';

export type SoundId =
  // UI (the panel and menus)
  | 'cursor' | 'confirm' | 'cancel' | 'panel-open' | 'panel-close'
  // UI taps (docs/design.md#taps): a soft select, the switch pair, a page, the "can't" boop, sync, undo
  | 'select' | 'toggle-on' | 'toggle-off' | 'page' | 'boop' | 'whoosh' | 'undo'
  // island actions and money
  | 'rustle' | 'thud' | 'coin' | 'bells' | 'purchase'
  // jingles (duck the music, one at a time)
  | 'fanfare' | 'miles' | 'chime'
  // villager reactions (the sound under an emote bubble)
  | 'pop' | 'surprise' | 'heart' | 'sparkle' | 'oops'
  // scenery taps (docs/design.md#scene-interactions): quiet, jittered, two at most
  | 'swish' | 'puff' | 'twinkle' | 'splash' | 'step-sand' | 'step-grass' | 'step-snow' | 'step-splash'
  | 'step-stone'
  // the island's critters and the balloon (docs/design.md#scene-interactions): a bobber plop, the bite (the bobber
  // yanked under), the reel, a little catch tune, the net's swing, the balloon's pop
  | 'plop' | 'bite' | 'reel' | 'catch' | 'net' | 'burst'
  // beach finds (docs/design.md#beach-finds): a shell's clink, the shovel in the earth, a bottle's glass and cork
  | 'shell' | 'dig' | 'bottle'
  // island care: a weed plucked, the watering can's sprinkle, the rock's clonk
  | 'pluck' | 'sprinkle' | 'clonk'
  // the campfire poked: a soft crackle of sparks
  | 'crackle'
  // the fixed decor (island/fixedDecor.ts): a bench's wooden creak, the shishi-odoshi's hollow "kon", the pull-up
  // bar's soft ring, the pump's squeak and gush
  | 'creak' | 'kon' | 'clang' | 'pump'
  // a shaken tree's wasps: their angry buzz
  | 'buzz'
  // group stretching (island/stretching.ts): a bright little march on the piano for the stretches (an original, ~6 s)
  | 'stretch-song'
  // the night sky: a wish's soft chime; fireworks: a rocket's rising whistle and the burst (a soft boom and a crackle)
  | 'wish' | 'whistle' | 'firework'
  // a birthday's cake (island/Cake.svelte): a little music box (an original waltz, ~4 s)
  | 'music-box'
  // NH's two fanfares (jingles): an item got (受け取る, a present), a set completed (all four goals, both of us)
  | 'get-fanfare' | 'complete-fanfare'
  // しずえ's island broadcast (島内放送) and the radio jingle that opens it on the day's first open (radio.ts): one of
  // six for the time of day, or the holiday's own on its day
  | 'island-broadcast' | RadioJingle;

/** The time of day's radio jingles (radio.ts): morning 05–11, noon 11–17, evening 17–05. */
export type RadioSlot = 'morning' | 'noon' | 'evening';
const RADIO_SLOTS: readonly RadioSlot[] = ['morning', 'noon', 'evening'];
/** Six variants per time of day. */
export const RADIO_VARIANTS = 6;
/** The holidays with their own radio jingle (radio.ts radioJingleAt). */
export type RadioHoliday = 'bunny-day' | 'halloween' | 'turkey-day' | 'toy-day' | 'countdown' | 'carnival';
const RADIO_HOLIDAYS: readonly RadioHoliday[] = ['bunny-day', 'halloween', 'turkey-day', 'toy-day', 'countdown', 'carnival'];
export type RadioJingle = `radio-${RadioSlot}-${1 | 2 | 3 | 4 | 5 | 6}` | `radio-${RadioHoliday}`;
export const RADIO_JINGLES: readonly RadioJingle[] = [
  ...RADIO_SLOTS.flatMap((s) => Array.from({ length: RADIO_VARIANTS }, (_, i) => `radio-${s}-${i + 1}` as RadioJingle)),
  ...RADIO_HOLIDAYS.map((h): RadioJingle => `radio-${h}`)
];

/** What a scenery tap asks to sound like (island/sceneTaps.ts sceneSfx → the `scene-<kind>` cue in cues.ts). */
export type SceneSfx =
  | 'bush' | 'flower' | 'cloud' | 'sun' | 'moon' | 'star' | 'shooting-star'
  | 'splash' | 'fish' | 'sand' | 'grass' | 'snow' | 'balloon' | 'butterfly'
  | 'present' | 'cast' | 'plop' | 'nibble' | 'bite' | 'reel' | 'catch' | 'flee' | 'net' | 'bug-flee'
  | 'shell' | 'fragment' | 'bottle' | 'dig' | 'wish' | 'weed' | 'water' | 'clonk' | 'glint' | 'visitor'
  // shaking a tree (island/treeShake.ts): a nest lands, its wasps buzz out, they sting; a branch picked up
  | 'nest' | 'buzz' | 'sting' | 'twig'
  // mushroom season (island/mushrooms.ts): one picked up beside a tree
  | 'mushroom'
  // fireworks (island/Fireworks.svelte)
  | 'launch' | 'firework'
  // the campfire by the tent poked (island/SceneTaps.svelte)
  | 'campfire'
  // the fixed decor tapped (island/SceneTaps.svelte): a bench, the shishi-odoshi, the pull-up bar, the pump, the rest
  | 'bench' | 'kon' | 'bar' | 'pump' | 'decor';

interface SoundDef {
  bus: 'sfx';
  /** Level on its bus, 0–1 (the placeholder renders all peak at the same level; this is the mix). */
  gain: number;
  /** ± cents of random pitch per play (NH never plays a repeated effect at exactly the same pitch). */
  jitter: number;
  /** Voices of this id at once; a new one stops the oldest. */
  max: number;
  /** A jingle: ducks the music under it and never overlaps another jingle (the later one is dropped). */
  jingle?: boolean;
  /** No placeholder of its own: without its file it sounds like this id (its file, else its placeholder). */
  like?: SoundId;
  /** Its file is fetched on its first play, not on the unlock, and kept in a small cache (engine.ts LAZY_CAP): the
   *  many long jingles heard once a day. */
  lazy?: boolean;
}

// Levels: soft UI ticks well under the island actions, the jingles at the top (they are the rewards).
export const SOUNDS: Record<SoundId, SoundDef> = {
  cursor: { bus: 'sfx', gain: 0.35, jitter: 0, max: 1 },
  confirm: { bus: 'sfx', gain: 0.55, jitter: 0, max: 1 },
  cancel: { bus: 'sfx', gain: 0.5, jitter: 0, max: 1 },
  'panel-open': { bus: 'sfx', gain: 0.55, jitter: 0, max: 1 },
  'panel-close': { bus: 'sfx', gain: 0.5, jitter: 0, max: 1 },
  // taps: heard dozens of times a day, so under the confirm; the keypad the softest of all
  select: { bus: 'sfx', gain: 0.38, jitter: 20, max: 1 },
  'toggle-on': { bus: 'sfx', gain: 0.4, jitter: 0, max: 1 },
  'toggle-off': { bus: 'sfx', gain: 0.36, jitter: 0, max: 1 },
  page: { bus: 'sfx', gain: 0.24, jitter: 60, max: 1 },
  boop: { bus: 'sfx', gain: 0.4, jitter: 0, max: 1 },
  whoosh: { bus: 'sfx', gain: 0.38, jitter: 30, max: 1 },
  undo: { bus: 'sfx', gain: 0.45, jitter: 0, max: 1 },
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
  'step-splash': { bus: 'sfx', gain: 0.35, jitter: 90, max: 2 },
  'step-stone': { bus: 'sfx', gain: 0.35, jitter: 80, max: 2 },
  plop: { bus: 'sfx', gain: 0.4, jitter: 60, max: 2 },
  // the bite must be heard over the waves: the loudest of the scenery (still ≤ 0.5)
  bite: { bus: 'sfx', gain: 0.5, jitter: 40, max: 1 },
  reel: { bus: 'sfx', gain: 0.3, jitter: 30, max: 1 },
  // a catch's little tune: an effect, not a jingle (it must not duck the music)
  catch: { bus: 'sfx', gain: 0.42, jitter: 10, max: 1 },
  net: { bus: 'sfx', gain: 0.38, jitter: 70, max: 2 },
  burst: { bus: 'sfx', gain: 0.42, jitter: 50, max: 1 },
  shell: { bus: 'sfx', gain: 0.38, jitter: 60, max: 2 },
  dig: { bus: 'sfx', gain: 0.45, jitter: 50, max: 1 },
  bottle: { bus: 'sfx', gain: 0.4, jitter: 40, max: 1 },
  pluck: { bus: 'sfx', gain: 0.4, jitter: 70, max: 2 },
  sprinkle: { bus: 'sfx', gain: 0.35, jitter: 60, max: 1 },
  clonk: { bus: 'sfx', gain: 0.45, jitter: 50, max: 2 },
  crackle: { bus: 'sfx', gain: 0.4, jitter: 120, max: 2 },
  creak: { bus: 'sfx', gain: 0.35, jitter: 90, max: 1 },
  kon: { bus: 'sfx', gain: 0.45, jitter: 30, max: 1 },
  clang: { bus: 'sfx', gain: 0.3, jitter: 40, max: 1 },
  pump: { bus: 'sfx', gain: 0.4, jitter: 50, max: 1 },
  buzz: { bus: 'sfx', gain: 0.4, jitter: 40, max: 1 },
  'stretch-song': { bus: 'sfx', gain: 0.55, jitter: 0, max: 1, jingle: true },
  // a wish: an effect, not a jingle (it must not duck the music)
  wish: { bus: 'sfx', gain: 0.38, jitter: 20, max: 1 },
  // fireworks come every couple of seconds for hours: kept low, two at most
  whistle: { bus: 'sfx', gain: 0.16, jitter: 120, max: 2 },
  firework: { bus: 'sfx', gain: 0.28, jitter: 90, max: 2 },
  'music-box': { bus: 'sfx', gain: 0.5, jitter: 0, max: 1, jingle: true },
  'get-fanfare': { bus: 'sfx', gain: 0.75, jitter: 0, max: 1, jingle: true, like: 'fanfare' },
  'complete-fanfare': { bus: 'sfx', gain: 0.75, jitter: 0, max: 1, jingle: true, like: 'fanfare', lazy: true },
  // the broadcast's opening; a radio jingle without its file sounds like it, and it like the PA chime
  'island-broadcast': { bus: 'sfx', gain: 0.55, jitter: 0, max: 1, jingle: true, like: 'chime', lazy: true },
  ...(Object.fromEntries(RADIO_JINGLES.map((id) => [id, { bus: 'sfx', gain: 0.55, jitter: 0, max: 1, jingle: true, like: 'island-broadcast', lazy: true }])) as Record<RadioJingle, SoundDef>)
};

export const SOUND_IDS = Object.keys(SOUNDS) as SoundId[];

export const isSoundId = (s: string): s is SoundId => Object.hasOwn(SOUNDS, s);

/** The ids with a placeholder of their own (synth.ts): every id without a `like`. */
export type SynthId = Exclude<SoundId, 'get-fanfare' | 'complete-fanfare' | 'island-broadcast' | RadioJingle>;
export const SYNTH_IDS = SOUND_IDS.filter((id): id is SynthId => !SOUNDS[id].like);

/** Whose placeholder an id uses: its own, or its `like`'s (followed to the end). */
export function placeholderOf(id: SoundId): SynthId {
  let i = id;
  for (let n = 0; SOUNDS[i].like && n < 8; n++) i = SOUNDS[i].like!;
  return i as SynthId;
}
