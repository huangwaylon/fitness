// The one place app moments meet sounds (docs/design.md#cues, the mapping table). Components and the motion
// director call cue('…') at the moment; what it sounds like (and how loud, how late) is decided here, so the mix can
// be tuned without touching a component. Villager reactions name their cue in the reaction catalogue
// (motion/reactions.ts `cue`), and the director plays it with the step.
import { untrack } from 'svelte';
import type { SceneSfx, SoundId } from './ids.ts';
import { semitones } from './mix.ts';
import { covered, play } from './sound.svelte.ts';

export type Cue =
  // the island
  | 'tree-shake' | 'fruit-land' | 'fruit-pick' | 'coin-land' | 'bells-arrive' | 'jar-tap'
  // villagers and しずえ (reaction steps)
  | 'villager-tap' | 'host-tap' | 'emote-surprise' | 'emote-love' | 'emote-joy' | 'emote-idea' | 'trouble' | 'announce'
  // choices
  | 'choice-move' | 'choice-pick'
  // taps (docs/design.md#taps; most are named by a control's data-sfx, taps.ts)
  | 'tick' | 'open' | 'confirm' | 'toggle-on' | 'toggle-off' | 'page' | 'boop' | 'sync' | 'undo'
  // the panel
  | 'panel-open' | 'panel-close' | 'back'
  // money and the harvest
  | 'buy' | 'badge-met' | 'harvest-receive'
  // both of us met all four goals today (our celebration's volley)
  | 'goals-complete'
  // scenery taps (island/sceneTaps.ts sceneSfx)
  | `scene-${SceneSfx}`
  // a walking villager's footsteps (island/IslandScene: by the ground under it; a splash on a rainy day)
  | 'footstep-grass' | 'footstep-sand' | 'footstep-snow' | 'footstep-splash' | 'footstep-stone'
  // group stretching's tune
  | 'stretch'
  // a birthday's cake
  | 'birthday-cake';

interface CueDef {
  sound: SoundId;
  /** A sound of the island itself: silent while a sheet, the panel or the harvest covers the scene (NH's world goes
   *  quiet under its menus). UI cues always play. */
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
  // a fallen fruit picked up: a bright little pop, a fourth up
  'fruit-pick': { sound: 'pop', gain: 0.8, step: 5, world: true },
  // a met goal's flower opens in its bed: fruit-pick's pop, softer, as the flower pops (fl-open at 120 ms)
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
  'choice-move': { sound: 'cursor' },
  'choice-pick': { sound: 'confirm' },
  // taps (docs/design.md#taps): all UI, so they sound under a sheet too
  tick: { sound: 'cursor', gain: 0.8 },
  open: { sound: 'select' },
  confirm: { sound: 'confirm' },
  'toggle-on': { sound: 'toggle-on' },
  'toggle-off': { sound: 'toggle-off' },
  page: { sound: 'page' },
  boop: { sound: 'boop' },
  sync: { sound: 'whoosh' },
  undo: { sound: 'undo' },
  'panel-open': { sound: 'panel-open' },
  'panel-close': { sound: 'panel-close' },
  back: { sound: 'cancel' },
  buy: { sound: 'purchase' },
  'badge-met': { sound: 'miles' },
  // NH's item-get fanfare (受け取る, a birthday's or the wedding's present)
  'harvest-receive': { sound: 'get-fanfare' },
  // NH's set-complete fanfare as our celebration's fireworks go up (island/Fireworks.svelte; once a day per phone)
  'goals-complete': { sound: 'complete-fanfare', world: true },
  // scenery (docs/design.md#scene-interactions): quiet world sounds, muted under a sheet like the rest of the island
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
  // the balloon pops; its present lands with a soft thud (the fall keyframes touch down at 1.5 s)
  'scene-balloon': { sound: 'burst', world: true },
  'scene-present': { sound: 'thud', gain: 0.5, delay: 1.5, world: true },
  // fishing: the rod's swing, the bobber landing on the cast's arc, a nibble's little bob, the bite (its own sound: the
  // bobber yanked under with a deep gulp and a splash), the
  // reel and the catch tune, or the fish's getaway; the net's swing and a startled bug
  'scene-cast': { sound: 'swish', gain: 0.8, world: true },
  'scene-plop': { sound: 'plop', delay: 0.3, world: true },
  'scene-nibble': { sound: 'plop', gain: 0.45, step: 5, world: true },
  'scene-bite': { sound: 'bite', world: true },
  'scene-reel': { sound: 'reel', world: true },
  'scene-catch': { sound: 'catch', delay: 0.25, world: true },
  'scene-flee': { sound: 'splash', gain: 0.6, step: 3, world: true },
  'scene-net': { sound: 'net', world: true },
  'scene-bug-flee': { sound: 'swish', gain: 0.6, step: 5, world: true },
  // beach finds: a shell's clink, a star fragment's glint, the bottle's glass and cork, the shovel (the fossil's
  // reveal plays the catch tune), a wish on a shooting star
  'scene-shell': { sound: 'shell', world: true },
  'scene-fragment': { sound: 'sparkle', gain: 0.5, step: 7, world: true },
  'scene-bottle': { sound: 'bottle', world: true },
  'scene-dig': { sound: 'dig', world: true },
  'scene-wish': { sound: 'wish', world: true },
  // island care: a weed pulled, a flower watered, the rock's clonk and, now and then, its sparkle
  'scene-weed': { sound: 'pluck', world: true },
  'scene-water': { sound: 'sprinkle', world: true },
  'scene-clonk': { sound: 'clonk', world: true },
  'scene-campfire': { sound: 'crackle', world: true },
  // the fixed decor: a bench creaks, the shishi-odoshi knocks, the bar rings, the pump gushes, the rest a soft knock
  'scene-bench': { sound: 'creak', world: true },
  'scene-kon': { sound: 'kon', world: true },
  'scene-bar': { sound: 'clang', world: true },
  'scene-pump': { sound: 'pump', world: true },
  'scene-decor': { sound: 'clonk', gain: 0.6, world: true },
  // shaking a tree: the nest's thud, its wasps' buzz, the sting's yelp, a branch picked up (a little pop)
  'scene-nest': { sound: 'thud', gain: 0.6, world: true },
  'scene-buzz': { sound: 'buzz', world: true },
  'scene-sting': { sound: 'surprise', world: true },
  'scene-twig': { sound: 'pop', gain: 0.8, step: 3, world: true },
  'scene-glint': { sound: 'sparkle', gain: 0.6, step: 5, delay: 0.1, world: true },
  // mushroom season: a mushroom picked up beside a tree (a soft pop, a little higher than a branch)
  'scene-mushroom': { sound: 'pop', gain: 0.7, step: 7, world: true },
  // visitors: a soft pop for a tap; K.K.'s tune (a jingle, only with the music on)
  'scene-visitor': { sound: 'pop', gain: 0.6, world: true },
  // a walking villager's steps: the scenery's own step sounds, much quieter (at most one per 320 ms, the director's)
  'footstep-grass': { sound: 'step-grass', gain: 0.3, world: true },
  'footstep-sand': { sound: 'step-sand', gain: 0.3, world: true },
  'footstep-snow': { sound: 'step-snow', gain: 0.3, world: true },
  'footstep-splash': { sound: 'step-splash', gain: 0.3, world: true },
  'footstep-stone': { sound: 'step-stone', gain: 0.3, world: true },
  // fireworks (island/Fireworks.svelte): the rocket's whistle as it rises, the burst as it opens
  'scene-launch': { sound: 'whistle', world: true },
  'scene-firework': { sound: 'firework', world: true },
  // group stretching (island/stretching.ts): the tape deck's tune under the ~6 s routine (a jingle: the music ducks);
  // with ミュージック on and NH's track there, its aerobics music cuts in instead (sound.svelte.ts eventJingle)
  stretch: { sound: 'stretch-song', world: true },
  // a birthday's cake (island/Cake.svelte): its music box as the candles go out (with ミュージック on and the file there,
  // NH's Happy Birthday cuts in instead)
  'birthday-cake': { sound: 'music-box', world: true }
};

/** A run of coins climbs this major pentatonic (semitones), one note per coin across the whole batch, then holds the
 *  top: one rising gesture instead of the same three notes again and again. */
const COIN_RUN = [0, 2, 4, 7, 9, 12, 14, 16, 19] as const;
export const coinStep = (n: number): number => COIN_RUN[Math.min(Math.max(0, n), COIN_RUN.length - 1)];

/** Test hook (e2e/sound.spec.ts): an array on `window.__cues` collects every cue that passes the world/UI rule. */

/** Play a moment's sound. `step`: semitones up; `gain`: × the cue's level. */
export function cue(c: Cue, o: { step?: number; gain?: number } = {}): void {
  // untracked: a cue fired from an {@attach} or an $effect must not make it depend on the sheets or the sound
  // settings (FruitTree's drop-in re-ran, re-dropping and re-thudding its newest fruit, every time a sheet closed)
  untrack(() => {
    const d = CUES[c];
    if (d.world && covered()) return;
    globalThis.__cues?.push(c);
    const step = (d.step ?? 0) + (o.step ?? 0);
    play(d.sound, { gain: (d.gain ?? 1) * (o.gain ?? 1), delay: d.delay ?? 0, rate: step ? semitones(step) : undefined });
  });
}
