// Procedural placeholder effects (docs/design.md#audio-files): original, short, NH-*inspired* sounds rendered as raw
// samples (pure: no AudioContext, deterministic per id), so the feature works before any audio file exists. Each is
// built from a few soft mallets, bells, glides and filtered noise. None of them copies a game melody: the jingles
// are plain arpeggios and the announcement chime is the generic Japanese PA ピンポンパンポン (F-A-C-F).
// A file in static/audio/manifest.json replaces the placeholder of its id.
import type { SynthId } from './ids.ts';
import { seeded } from '#lib/random.ts';

type Wave = 'sine' | 'tri' | 'sq';

interface Tone {
  kind: 'tone';
  /** Hz, start time and length (s: the decay reaches −60 dB at `d`). */
  f: number;
  t: number;
  d: number;
  g: number;
  wave?: Wave;
  /** Glide to `to` Hz over `glide` s (exponential). */
  to?: number;
  glide?: number;
  attack?: number;
  /** Extra partials: [frequency ratio, level, decay scale]. */
  partials?: [number, number, number][];
  /** Vibrato [Hz, cents] and tremolo [Hz, depth 0–1]. */
  vib?: [number, number];
  trem?: [number, number];
}

interface Noise {
  kind: 'noise';
  t: number;
  d: number;
  g: number;
  /** Band, Hz (one-pole high-pass at `lo`, low-pass at `hi`). */
  lo: number;
  hi: number;
  /** 'decay' = a hit; 'swell' = rises and falls (leaves). */
  shape: 'decay' | 'swell';
  /** Crackle grains per second (each a short burst): dry leaves. */
  grains?: number;
}

type Ev = Tone | Noise;

/** MIDI note → Hz (69 = A4 440). */
const hz = (m: number) => 440 * 2 ** ((m - 69) / 12);
const C5 = 72, E5 = 76, F5 = 77, G5 = 79, A5 = 81, C6 = 84, D6 = 86, E6 = 88, F6 = 89, G6 = 91, A6 = 93, B6 = 95, C7 = 96, E7 = 100, G7 = 103, A7 = 105, C8 = 108;

const mallet = (m: number, t: number, d: number, g: number): Tone => ({
  kind: 'tone', f: hz(m), t, d, g, attack: 0.002, partials: [[4, 0.22, 0.25], [2, 0.08, 0.5]]
});
const bell = (m: number, t: number, d: number, g: number): Tone => ({
  kind: 'tone', f: hz(m), t, d, g, attack: 0.001, partials: [[2.76, 0.4, 0.4], [5.4, 0.18, 0.2], [8.93, 0.06, 0.1]]
});
const vibe = (m: number, t: number, d: number, g: number): Tone => ({
  kind: 'tone', f: hz(m), t, d, g, attack: 0.004, partials: [[4, 0.12, 0.3], [3, 0.05, 0.4]], trem: [5, 0.18]
});

const RECIPES: Record<SynthId, Ev[]> = {
  cursor: [{ kind: 'tone', f: hz(C7), t: 0, d: 0.045, g: 0.6, attack: 0.001, partials: [[2, 0.2, 0.5]] }],
  // "pi-pon": up a fifth
  confirm: [mallet(E6, 0, 0.16, 0.8), mallet(B6, 0.075, 0.24, 0.9)],
  // down a fourth, a little rounder
  cancel: [{ ...mallet(D6, 0, 0.14, 0.8), wave: 'tri' }, { ...mallet(G5, 0.07, 0.2, 0.8), wave: 'tri' }],
  'panel-open': [mallet(C6, 0, 0.2, 0.7), mallet(E6, 0.05, 0.2, 0.7), mallet(G6, 0.1, 0.2, 0.75), mallet(C7, 0.15, 0.36, 0.85)],
  'panel-close': [mallet(G6, 0, 0.15, 0.75), mallet(C6, 0.06, 0.26, 0.8)],
  // taps (docs/design.md#taps). select: one soft woody "pok" (lighter than the confirm's two notes)
  select: [{ ...mallet(A6, 0, 0.11, 0.9), wave: 'tri' }],
  // a switch: two quick notes up (on) / down (off), the off one rounder
  'toggle-on': [mallet(C6, 0, 0.07, 0.7), mallet(G6, 0.045, 0.12, 0.9)],
  'toggle-off': [{ ...mallet(G6, 0, 0.07, 0.75), wave: 'tri' }, { ...mallet(C6, 0.045, 0.12, 0.8), wave: 'tri' }],
  // a page turned: a paper flick
  page: [
    { kind: 'noise', t: 0, d: 0.15, g: 1, lo: 1800, hi: 9000, shape: 'swell' },
    { kind: 'noise', t: 0.1, d: 0.05, g: 0.45, lo: 600, hi: 3500, shape: 'decay' }
  ],
  // "can't": a low, soft two-step down (NH when you can't afford something), never harsh
  boop: [
    { kind: 'tone', f: 330, to: 300, glide: 0.08, t: 0, d: 0.1, g: 0.8, wave: 'tri', attack: 0.004, partials: [[2, 0.25, 0.6]] },
    { kind: 'tone', f: 247, to: 220, glide: 0.1, t: 0.1, d: 0.16, g: 0.8, wave: 'tri', attack: 0.004, partials: [[2, 0.25, 0.6]] }
  ],
  // sync: an airy rising whoosh with a soft bell at the top
  whoosh: [
    { kind: 'noise', t: 0, d: 0.34, g: 1, lo: 400, hi: 2600, shape: 'swell' },
    { kind: 'noise', t: 0.08, d: 0.28, g: 0.5, lo: 2400, hi: 9000, shape: 'swell' },
    { kind: 'tone', f: 420, to: 1250, glide: 0.3, t: 0.02, d: 0.3, g: 0.12, attack: 0.03 },
    bell(G7, 0.3, 0.25, 0.12)
  ],

  // undo: the app-open chirp played backwards (a glide down), then a low note
  undo: [{ kind: 'tone', f: 1300, to: 600, glide: 0.06, t: 0, d: 0.1, g: 0.8, attack: 0.001 }, mallet(E6, 0.06, 0.18, 0.35)],
  rustle: [
    { kind: 'noise', t: 0, d: 0.42, g: 1, lo: 1500, hi: 7000, shape: 'swell', grains: 70 },
    { kind: 'noise', t: 0.02, d: 0.36, g: 0.4, lo: 300, hi: 1800, shape: 'swell' }
  ],
  thud: [
    { kind: 'tone', f: 150, to: 55, glide: 0.1, t: 0, d: 0.16, g: 1, attack: 0.001 },
    { kind: 'noise', t: 0, d: 0.03, g: 0.35, lo: 100, hi: 1200, shape: 'decay' }
  ],
  // "chi-ling": two quick strikes
  coin: [bell(E7, 0, 0.35, 0.8), bell(A7, 0.035, 0.22, 0.45)],
  bells: [
    bell(C7, 0, 0.3, 0.6), bell(E7, 0.06, 0.3, 0.6), bell(G7, 0.12, 0.3, 0.6), bell(C8, 0.18, 0.5, 0.5),
    { kind: 'noise', t: 0.05, d: 0.3, g: 0.12, lo: 6000, hi: 12000, shape: 'decay' }
  ],
  // the drawer ("ka"), then the register bell ("ching")
  purchase: [
    { kind: 'noise', t: 0, d: 0.05, g: 0.6, lo: 300, hi: 3000, shape: 'decay' },
    { kind: 'noise', t: 0.035, d: 0.03, g: 0.4, lo: 800, hi: 5000, shape: 'decay' },
    bell(C7, 0.07, 0.6, 0.7), bell(E7, 0.07, 0.6, 0.5), bell(G7, 0.07, 0.5, 0.35)
  ],
  // an original item-get: a rising arpeggio to a held, vibrato top note over a soft chord, and a twinkle
  fanfare: [
    { kind: 'tone', f: hz(G5), t: 0, d: 0.2, g: 0.7, wave: 'tri', partials: [[2, 0.2, 0.6], [3, 0.1, 0.5]] },
    { kind: 'tone', f: hz(C6), t: 0.12, d: 0.2, g: 0.7, wave: 'tri', partials: [[2, 0.2, 0.6], [3, 0.1, 0.5]] },
    { kind: 'tone', f: hz(E6), t: 0.24, d: 0.2, g: 0.75, wave: 'tri', partials: [[2, 0.2, 0.6], [3, 0.1, 0.5]] },
    { kind: 'tone', f: hz(G6), t: 0.36, d: 1.05, g: 0.85, wave: 'tri', attack: 0.01, vib: [5.5, 18], partials: [[2, 0.2, 0.6], [3, 0.1, 0.5]] },
    mallet(E5, 0.36, 0.9, 0.45), mallet(C5, 0.36, 0.9, 0.45),
    bell(C8, 0.52, 0.5, 0.18)
  ],
  // an achievement: three quick steps up and a little shimmer
  miles: [mallet(E6, 0, 0.2, 0.8), mallet(G6, 0.08, 0.2, 0.8), mallet(C7, 0.16, 0.7, 1), bell(G7, 0.26, 0.4, 0.25), bell(C8, 0.34, 0.5, 0.2)],
  // ピンポンパンポン: the generic Japanese announcement chime, on a soft vibraphone
  chime: [vibe(F5, 0, 1, 0.8), vibe(A5, 0.24, 1, 0.8), vibe(C6, 0.48, 1, 0.8), vibe(F6, 0.72, 1.4, 0.85)],
  pop: [{ kind: 'tone', f: 420, to: 950, glide: 0.035, t: 0, d: 0.08, g: 1, attack: 0.001 }],
  surprise: [{ kind: 'tone', f: 500, to: 1250, glide: 0.09, t: 0, d: 0.14, g: 0.9, wave: 'tri' }, mallet(C7, 0.08, 0.18, 0.4)],
  heart: [{ ...mallet(C6, 0, 0.2, 0.7), wave: 'tri' }, { ...mallet(G6, 0.08, 0.32, 0.8), wave: 'tri', vib: [6, 12] }],
  sparkle: [bell(G6, 0, 0.25, 0.5), bell(C7, 0.05, 0.3, 0.45), bell(E7, 0.1, 0.35, 0.4)],
  oops: [{ kind: 'tone', f: 700, to: 420, glide: 0.22, t: 0, d: 0.3, g: 0.9, wave: 'tri', vib: [9, 40] }],
  // scenery: a soft swish through flowers, an airy cloud "pof", a shooting star's rising "shiing", a water plop, and
  // footsteps in sand (gritty), grass (soft), snow (a squeaky crunch), on wet ground (a small splash) and stone
  swish: [
    { kind: 'noise', t: 0, d: 0.22, g: 1, lo: 2200, hi: 8000, shape: 'swell' },
    { kind: 'noise', t: 0.01, d: 0.18, g: 0.3, lo: 500, hi: 2000, shape: 'swell' }
  ],
  puff: [
    { kind: 'noise', t: 0, d: 0.2, g: 1, lo: 150, hi: 1100, shape: 'swell' },
    { kind: 'tone', f: 240, to: 150, glide: 0.12, t: 0, d: 0.14, g: 0.35, attack: 0.01 }
  ],
  twinkle: [
    { kind: 'tone', f: hz(G6), to: hz(C8), glide: 0.38, t: 0, d: 0.62, g: 0.5, attack: 0.01, vib: [7, 15], partials: [[2.76, 0.2, 0.4]] },
    bell(E7, 0.08, 0.3, 0.3), bell(G7, 0.2, 0.3, 0.3), bell(C8, 0.34, 0.4, 0.3),
    { kind: 'noise', t: 0.05, d: 0.5, g: 0.08, lo: 7000, hi: 12000, shape: 'swell' }
  ],
  splash: [
    { kind: 'tone', f: 320, to: 980, glide: 0.04, t: 0, d: 0.07, g: 0.9, attack: 0.001 },
    { kind: 'noise', t: 0.015, d: 0.28, g: 0.7, lo: 900, hi: 7000, shape: 'decay', grains: 90 }
  ],
  'step-sand': [{ kind: 'noise', t: 0, d: 0.1, g: 1, lo: 500, hi: 3500, shape: 'decay', grains: 400 }],
  'step-grass': [{ kind: 'noise', t: 0, d: 0.13, g: 1, lo: 1400, hi: 6500, shape: 'swell', grains: 140 }],
  'step-snow': [
    { kind: 'noise', t: 0, d: 0.15, g: 1, lo: 1200, hi: 5000, shape: 'decay', grains: 500 },
    { kind: 'tone', f: 1900, to: 1500, glide: 0.06, t: 0.01, d: 0.07, g: 0.15, wave: 'tri' }
  ],
  'step-splash': [
    { kind: 'noise', t: 0, d: 0.12, g: 1, lo: 900, hi: 6000, shape: 'decay', grains: 260 },
    { kind: 'tone', f: 1300, to: 700, glide: 0.04, t: 0.005, d: 0.05, g: 0.12, attack: 0.002 }
  ],
  // a hard tap on the stairs' stone
  'step-stone': [
    { kind: 'noise', t: 0, d: 0.05, g: 1, lo: 2200, hi: 9000, shape: 'decay', grains: 220 },
    { kind: 'tone', f: 950, to: 800, glide: 0.02, t: 0, d: 0.03, g: 0.12, attack: 0.001 }
  ],
  // critters: a bobber's "pocha" (a quick falling note and a little water), the bite's gulp and splash, the reel's ratchet, an original catch tune
  // (four mallet notes up and a twinkle: not NH's), the net's airy swing and the balloon's "pan!" with a glint
  plop: [
    { kind: 'tone', f: 950, to: 260, glide: 0.05, t: 0, d: 0.1, g: 0.9, attack: 0.001 },
    { kind: 'noise', t: 0.02, d: 0.14, g: 0.35, lo: 600, hi: 3200, shape: 'decay', grains: 60 }
  ],
  // the bite: NH's "zubon!" as the float is yanked under: a deep falling gulp, a heavy splash and a bright spray,
  // nothing like the nibble's light high "pocha"
  bite: [
    { kind: 'tone', f: 520, to: 95, glide: 0.12, t: 0, d: 0.24, g: 1, attack: 0.002, partials: [[2, 0.3, 0.4]] },
    { kind: 'noise', t: 0.01, d: 0.34, g: 0.9, lo: 250, hi: 2400, shape: 'decay', grains: 120 },
    { kind: 'noise', t: 0.04, d: 0.3, g: 0.55, lo: 2500, hi: 9000, shape: 'decay', grains: 200 },
    { kind: 'tone', f: 180, to: 70, glide: 0.2, t: 0.06, d: 0.26, g: 0.5, attack: 0.004 }
  ],
  reel: [
    ...Array.from({ length: 7 }, (_, i): Noise => ({ kind: 'noise', t: i * 0.045, d: 0.022, g: 0.7, lo: 2200, hi: 8000, shape: 'decay' })),
    { kind: 'tone', f: 520, to: 880, glide: 0.3, t: 0, d: 0.32, g: 0.12, wave: 'tri', attack: 0.01 }
  ],
  catch: [mallet(C6, 0, 0.2, 0.75), mallet(E6, 0.07, 0.2, 0.75), mallet(G6, 0.14, 0.2, 0.8), mallet(C7, 0.21, 0.4, 0.9), bell(G7, 0.3, 0.32, 0.18)],
  net: [
    { kind: 'noise', t: 0, d: 0.2, g: 1, lo: 700, hi: 4000, shape: 'swell' },
    { kind: 'noise', t: 0.03, d: 0.15, g: 0.4, lo: 3000, hi: 9000, shape: 'swell' }
  ],
  burst: [
    { kind: 'noise', t: 0, d: 0.07, g: 1, lo: 1500, hi: 10000, shape: 'decay' },
    { kind: 'tone', f: 260, to: 120, glide: 0.06, t: 0, d: 0.1, g: 0.5, attack: 0.001 },
    bell(E7, 0.05, 0.25, 0.15)
  ],
  // beach finds: a shell picked off the sand (two porcelain clinks and a little grit), the shovel biting the earth
  // twice (a gritty crunch and a dull knock), a glass bottle's "tink" and its cork's "pon"
  shell: [
    { kind: 'noise', t: 0, d: 0.05, g: 0.3, lo: 2500, hi: 9000, shape: 'decay', grains: 300 },
    bell(A6, 0.01, 0.14, 0.6), bell(E7, 0.06, 0.18, 0.5)
  ],
  dig: [
    { kind: 'noise', t: 0, d: 0.14, g: 1, lo: 200, hi: 1800, shape: 'decay', grains: 300 },
    { kind: 'tone', f: 120, to: 60, glide: 0.08, t: 0.02, d: 0.12, g: 0.6, attack: 0.002 },
    { kind: 'noise', t: 0.3, d: 0.14, g: 0.85, lo: 200, hi: 2000, shape: 'decay', grains: 300 },
    { kind: 'tone', f: 110, to: 55, glide: 0.08, t: 0.32, d: 0.12, g: 0.5, attack: 0.002 }
  ],
  // island care: a weed plucked (a rip of grass and a little "pop"), the can's sprinkle (a soft patter), the rock's
  // "kon" (a dull woody knock with a stony click)
  pluck: [
    { kind: 'noise', t: 0, d: 0.12, g: 0.8, lo: 1400, hi: 6500, shape: 'swell', grains: 160 },
    { kind: 'tone', f: 380, to: 900, glide: 0.04, t: 0.08, d: 0.08, g: 0.9, attack: 0.001 }
  ],
  sprinkle: [
    { kind: 'noise', t: 0, d: 0.6, g: 1, lo: 2500, hi: 9000, shape: 'swell', grains: 220 },
    { kind: 'noise', t: 0.05, d: 0.45, g: 0.35, lo: 600, hi: 2500, shape: 'swell', grains: 80 }
  ],
  // a shaken tree's wasps: an angry swarm's buzz (two detuned square drones with a fast flutter, swelling and fading)
  buzz: [
    { kind: 'tone', f: 196, t: 0, d: 0.85, g: 0.5, wave: 'sq', attack: 0.06, vib: [11, 40], trem: [32, 0.6] },
    { kind: 'tone', f: 233, t: 0.04, d: 0.8, g: 0.35, wave: 'sq', attack: 0.08, vib: [9, 55], trem: [27, 0.5] },
    { kind: 'noise', t: 0, d: 0.8, g: 0.25, lo: 300, hi: 1600, shape: 'swell' }
  ],
  // the campfire poked: a soft low flutter of the flames and dry crackles of sparks, fading
  crackle: [
    { kind: 'noise', t: 0, d: 0.5, g: 0.35, lo: 90, hi: 600, shape: 'swell' },
    { kind: 'noise', t: 0.02, d: 0.9, g: 0.5, lo: 1800, hi: 7500, shape: 'decay', grains: 28 }
  ],
  // a bench's wooden creak: a slow rubbing glide with a grainy flutter
  creak: [
    { kind: 'tone', f: 160, to: 215, glide: 0.28, t: 0, d: 0.34, g: 0.55, wave: 'sq', attack: 0.04, trem: [38, 0.7] },
    { kind: 'noise', t: 0, d: 0.32, g: 0.3, lo: 300, hi: 1400, shape: 'swell', grains: 60 }
  ],
  // the shishi-odoshi: the bamboo's hollow knock on the stone ("kon") and the water spilling after it
  kon: [
    { kind: 'tone', f: 540, to: 400, glide: 0.035, t: 0, d: 0.32, g: 1, wave: 'tri', attack: 0.001, partials: [[2.71, 0.35, 0.3], [4.2, 0.12, 0.2]] },
    { kind: 'noise', t: 0, d: 0.03, g: 0.5, lo: 1500, hi: 6000, shape: 'decay' },
    { kind: 'noise', t: 0.06, d: 0.45, g: 0.22, lo: 1200, hi: 6500, shape: 'swell', grains: 90 }
  ],
  // the pull-up bar: a soft ring of a steel tube
  clang: [
    { kind: 'tone', f: 830, t: 0, d: 0.7, g: 0.6, attack: 0.001, partials: [[2.76, 0.35, 0.5], [5.4, 0.15, 0.3]] },
    { kind: 'noise', t: 0, d: 0.02, g: 0.3, lo: 2000, hi: 8000, shape: 'decay' }
  ],
  // the pump: the handle's squeak and the water's gush
  pump: [
    { kind: 'tone', f: 900, to: 1350, glide: 0.14, t: 0, d: 0.18, g: 0.35, wave: 'sq', attack: 0.01, vib: [30, 40] },
    { kind: 'noise', t: 0.16, d: 0.55, g: 0.8, lo: 400, hi: 3200, shape: 'swell', grains: 260 }
  ],
  clonk: [
    { kind: 'tone', f: 230, to: 170, glide: 0.06, t: 0, d: 0.16, g: 1, wave: 'tri', attack: 0.001, partials: [[2.4, 0.3, 0.3]] },
    { kind: 'noise', t: 0, d: 0.04, g: 0.5, lo: 1500, hi: 6000, shape: 'decay' }
  ],
  // Group stretching's tape: an original, bright little march on a soft piano (triangle tones with a hammer partial),
  // 2/4 at 120: bass on the beat, chord stabs off it, a tune climbing then coming home over I-IV-V-I, one phrase per
  // stretch (2 s each), ~6.3 s. Not the radio exercise song.
  'stretch-song': [
    ...['I', 'I', 'IV', 'IV', 'IV', 'IV', 'V', 'V', 'V', 'V', 'I', 'I'].flatMap((c, i): Tone[] => {
      const bass = { I: [48, 43], IV: [41, 48], V: [43, 50] }[c as 'I' | 'IV' | 'V'][i % 2];
      const chord = { I: [60, 64, 67], IV: [60, 65, 69], V: [59, 62, 67] }[c as 'I' | 'IV' | 'V'];
      return [
        { kind: 'tone', f: hz(bass), t: i * 0.5, d: 0.4, g: 0.42, wave: 'tri', attack: 0.004, partials: [[2, 0.3, 0.4]] },
        ...chord.map((m): Tone => ({ kind: 'tone', f: hz(m), t: i * 0.5 + 0.25, d: 0.18, g: 0.16, wave: 'tri', attack: 0.003, partials: [[2, 0.2, 0.3]] }))
      ];
    }),
    ...([[72, 0], [74, 0.25], [76, 0.5], [77, 0.75], [79, 1], [79, 1.5], [81, 2], [77, 2.5], [79, 3], [76, 3.5],
      [74, 4], [76, 4.25], [77, 4.5], [79, 4.75], [76, 5], [74, 5.25], [72, 5.5]] as const).map(([m, t]): Tone => ({
      kind: 'tone', f: hz(m), t, d: t === 5.5 ? 0.8 : 0.32, g: 0.5, wave: 'tri', attack: 0.003, partials: [[2, 0.18, 0.4], [4, 0.06, 0.2]]
    }))
  ],
  // a wish: four soft bells rising (G B D G), a breath of shimmer under them
  wish: [
    bell(G6, 0, 0.6, 0.5), bell(B6, 0.07, 0.6, 0.45), bell(D6 + 12, 0.14, 0.65, 0.42), bell(G7, 0.22, 0.72, 0.38),
    { kind: 'noise', t: 0.04, d: 0.8, g: 0.06, lo: 7000, hi: 12000, shape: 'swell' }
  ],
  // fireworks: a rocket's thin rising whistle; the burst: a soft low boom (not a bang: it plays for hours, quietly) and
  // a crackle of sparks fading
  whistle: [{ kind: 'tone', f: 700, to: 1700, glide: 0.75, t: 0, d: 0.8, g: 0.5, attack: 0.05, vib: [9, 25] }],
  firework: [
    { kind: 'tone', f: 110, to: 46, glide: 0.3, t: 0, d: 0.6, g: 1, attack: 0.004, partials: [[2.1, 0.25, 0.4]] },
    { kind: 'noise', t: 0, d: 0.45, g: 0.6, lo: 60, hi: 700, shape: 'decay' },
    { kind: 'noise', t: 0.08, d: 0.8, g: 0.35, lo: 2500, hi: 9000, shape: 'decay', grains: 45 }
  ],
  // A birthday's music box: an original little waltz in 3/4 on a comb (bright bells with a quick decay and a soft
  // tine partial), the melody over a plucked bass on each bar's first beat, ~4 s. Not "Happy Birthday".
  'music-box': [
    ...([[84, 0], [88, 0.3], [91, 0.6], [93, 0.9], [91, 1.2], [88, 1.5], [89, 1.8], [93, 2.1], [91, 2.4], [88, 2.7], [86, 3.0], [84, 3.3]] as const)
      .map(([m, t]): Tone => ({ ...bell(m, t, t === 3.3 ? 0.9 : 0.55, 0.42), partials: [[2.76, 0.25, 0.3], [5.4, 0.08, 0.15]] })),
    ...([[60, 0], [65, 0.9], [67, 1.8], [60, 2.7], [48, 3.3]] as const).map(([m, t]): Tone => bell(m + 12, t, 0.7, 0.22))
  ],
  // the rooms' instruments (components/tent/toggles.ts), each an original few bars (~3 s): no game's melody
  // a piano: a bright run up C major's pentatonic and a little turn home, a left hand under it
  'riff-keys': [
    ...([[72, 0], [74, 0.18], [76, 0.36], [79, 0.54], [81, 0.72], [79, 0.9], [76, 1.08], [79, 1.26], [84, 1.44], [81, 1.8], [79, 2.0], [76, 2.2], [72, 2.4]] as const)
      .map(([m, t]): Tone => ({ kind: 'tone', f: hz(m), t, d: t === 2.4 ? 0.9 : 0.4, g: 0.5, wave: 'tri', attack: 0.003, partials: [[2, 0.25, 0.4], [4, 0.08, 0.2]] })),
    ...([[48, 0], [55, 0.72], [53, 1.44], [48, 2.4]] as const).map(([m, t]): Tone => ({ kind: 'tone', f: hz(m), t, d: 0.9, g: 0.3, wave: 'tri', attack: 0.004, partials: [[2, 0.3, 0.4]] }))
  ],
  // a guitar: four strums (C, G, Am, F), each a quick roll down the strings
  'riff-strings': ([[48, 55, 60, 64, 67], [43, 50, 55, 59, 67], [45, 52, 57, 60, 64], [41, 48, 53, 57, 65]] as const).flatMap((ch, i): Tone[] =>
    ch.map((m, j): Tone => ({ kind: 'tone', f: hz(m), t: i * 0.62 + j * 0.018, d: i === 3 ? 1.1 : 0.6, g: 0.32, wave: 'tri', attack: 0.002, partials: [[2, 0.45, 0.35], [3, 0.2, 0.25]] }))),
  // a drum kit: kick, snare and hats, two bars and a crash
  'riff-drums': [
    ...[0, 0.5, 1.0, 1.25, 1.5, 2.0].map((t): Tone => ({ kind: 'tone', f: 130, to: 48, glide: 0.09, t, d: 0.2, g: 1, attack: 0.001 })),
    ...[0.25, 0.75, 1.75, 2.25, 2.37, 2.5].map((t): Noise => ({ kind: 'noise', t, d: 0.14, g: 0.8, lo: 900, hi: 6000, shape: 'decay' })),
    ...Array.from({ length: 10 }, (_, i): Noise => ({ kind: 'noise', t: i * 0.25 + 0.125, d: 0.04, g: 0.35, lo: 7000, hi: 12000, shape: 'decay' })),
    { kind: 'noise', t: 2.62, d: 0.8, g: 0.45, lo: 4000, hi: 12000, shape: 'decay' }
  ],
  // a gong: one low strike, its shimmer swelling and ringing out
  'riff-gong': [
    { kind: 'tone', f: 98, t: 0, d: 3.2, g: 0.9, attack: 0.004, vib: [3, 6], partials: [[1.48, 0.5, 0.8], [2.12, 0.35, 0.6], [2.83, 0.2, 0.5], [3.7, 0.12, 0.4]] },
    { kind: 'noise', t: 0, d: 2.4, g: 0.12, lo: 300, hi: 3000, shape: 'swell' }
  ],
  // a marimba: soft mallets running up and down, a roll on the last
  'riff-mallet': [
    ...[69, 72, 74, 76, 79, 76, 74, 72, 74, 76, 72].map((m, i): Tone => mallet(m, i * 0.2, 0.35, 0.6)),
    ...Array.from({ length: 6 }, (_, i): Tone => mallet(72, 2.2 + i * 0.07, 0.25, 0.35))
  ],
  // a saxophone: a lazy bluesy phrase, breathy, a bend into the long note
  'riff-winds': [
    ...([[67, 0, 0.35], [70, 0.36, 0.35], [72, 0.72, 0.6], [70, 1.32, 0.3], [67, 1.62, 0.3]] as const)
      .map(([m, t, d]): Tone => ({ kind: 'tone', f: hz(m), t, d: d + 0.25, g: 0.42, wave: 'sq', attack: 0.04, vib: [5, 14], partials: [[2, 0.3, 0.8], [3, 0.12, 0.6]] })),
    { kind: 'tone', f: hz(63), to: hz(65), glide: 0.18, t: 1.95, d: 1.1, g: 0.45, wave: 'sq', attack: 0.05, vib: [5.5, 22], partials: [[2, 0.3, 0.8]] },
    { kind: 'noise', t: 0, d: 2.9, g: 0.05, lo: 1500, hi: 6000, shape: 'swell' }
  ],
  // a theremin: a wavering voice sliding up, down and up again
  'riff-theremin': [
    { kind: 'tone', f: 440, to: 660, glide: 0.8, t: 0, d: 1.0, g: 0.55, attack: 0.12, vib: [6, 38] },
    { kind: 'tone', f: 660, to: 494, glide: 0.7, t: 0.9, d: 0.9, g: 0.55, attack: 0.08, vib: [6.5, 42] },
    { kind: 'tone', f: 494, to: 880, glide: 0.9, t: 1.7, d: 1.3, g: 0.5, attack: 0.08, vib: [6, 48] }
  ],
  // a voice: "la, la, la-laa" (a round vowel: a soft wave with its low partials)
  'riff-sing': ([[67, 0, 0.4], [69, 0.45, 0.4], [72, 0.9, 0.35], [74, 1.3, 0.35], [72, 1.7, 1.1]] as const)
    .map(([m, t, d]): Tone => ({ kind: 'tone', f: hz(m), t, d: d + 0.2, g: 0.5, wave: 'tri', attack: 0.05, vib: [5.5, 18], partials: [[2, 0.35, 0.9], [3, 0.15, 0.8]], trem: [5.5, 0.08] })),
  // a DJ's scratch over a beat: the record pulled back and forth
  'riff-dj': [
    ...[0, 0.5, 1.0, 1.5, 2.0].map((t): Tone => ({ kind: 'tone', f: 120, to: 50, glide: 0.08, t, d: 0.2, g: 0.9, attack: 0.001 })),
    ...[0.25, 0.4, 1.25, 1.35, 1.45, 2.25].map((t, i): Tone => ({ kind: 'tone', f: i % 2 ? 900 : 400, to: i % 2 ? 380 : 1000, glide: 0.09, t, d: 0.11, g: 0.4, wave: 'sq', attack: 0.004 })),
    ...[0.25, 0.4, 1.25, 1.35, 1.45, 2.25].map((t): Noise => ({ kind: 'noise', t, d: 0.1, g: 0.35, lo: 600, hi: 4000, shape: 'swell' }))
  ],
  // a screen on: the set's click and a soft rising whine; a channel changed: a burst of static
  'screen-on': [
    { kind: 'noise', t: 0, d: 0.03, g: 0.6, lo: 1500, hi: 8000, shape: 'decay' },
    { kind: 'tone', f: 2400, to: 3200, glide: 0.2, t: 0.02, d: 0.3, g: 0.12, attack: 0.03 },
    bell(G6, 0.05, 0.2, 0.25)
  ],
  static: [{ kind: 'noise', t: 0, d: 0.18, g: 1, lo: 800, hi: 9000, shape: 'swell', grains: 300 }],
  // a fan spinning up: an airy whirr rising
  whirr: [
    { kind: 'noise', t: 0, d: 0.7, g: 1, lo: 300, hi: 1600, shape: 'swell' },
    { kind: 'tone', f: 90, to: 160, glide: 0.5, t: 0, d: 0.7, g: 0.25, wave: 'tri', attack: 0.1, trem: [24, 0.5] }
  ],
  // a washer starting: a low churn and a slosh
  churn: [
    { kind: 'noise', t: 0, d: 0.8, g: 1, lo: 60, hi: 500, shape: 'swell', grains: 40 },
    { kind: 'noise', t: 0.25, d: 0.4, g: 0.5, lo: 400, hi: 2500, shape: 'swell', grains: 120 }
  ],
  // a tap turned on: water running
  faucet: [
    { kind: 'tone', f: 600, to: 300, glide: 0.08, t: 0, d: 0.08, g: 0.2, wave: 'sq', attack: 0.004 },
    { kind: 'noise', t: 0.04, d: 0.8, g: 1, lo: 1200, hi: 8000, shape: 'swell', grains: 260 }
  ],
  // steam: a soft hiss
  hiss: [{ kind: 'noise', t: 0, d: 0.9, g: 1, lo: 3000, hi: 11000, shape: 'swell' }],
  // a wardrobe's door: a creak, then its latch
  cupboard: [
    { kind: 'tone', f: 240, to: 330, glide: 0.25, t: 0, d: 0.3, g: 0.45, wave: 'sq', attack: 0.03, trem: [42, 0.7] },
    { kind: 'noise', t: 0.32, d: 0.04, g: 0.7, lo: 1200, hi: 6000, shape: 'decay' },
    { kind: 'tone', f: 520, to: 420, glide: 0.03, t: 0.32, d: 0.08, g: 0.3, wave: 'tri', attack: 0.001 }
  ],
  // a toy's squeak
  squeak: [{ kind: 'tone', f: 950, to: 1500, glide: 0.07, t: 0, d: 0.16, g: 0.8, wave: 'sq', attack: 0.005, vib: [28, 60] }],
  // a tick-tock (Newton's cradle's click, a metronome)
  ticktock: [0, 0.32, 0.64, 0.96, 1.28, 1.6].map((t, i): Tone => ({ kind: 'tone', f: i % 2 ? 1500 : 1900, t, d: 0.05, g: 0.6 - i * 0.07, wave: 'tri', attack: 0.001, partials: [[2.7, 0.3, 0.4]] })),
  bottle: [
    bell(E7, 0, 0.3, 0.55),
    { kind: 'tone', f: 520, to: 1150, glide: 0.03, t: 0.14, d: 0.07, g: 0.7, attack: 0.001 },
    { kind: 'noise', t: 0.14, d: 0.04, g: 0.25, lo: 1500, hi: 6000, shape: 'decay' }
  ]
};


const wave = (w: Wave, ph: number) => {
  const s = Math.sin(2 * Math.PI * ph);
  if (w === 'sine') return s;
  if (w === 'tri') return (2 / Math.PI) * Math.asin(s);
  return Math.tanh(3 * s) / Math.tanh(3); // a soft square
};

function addTone(out: Float32Array, sr: number, e: Tone): void {
  const start = Math.round(e.t * sr);
  const n = Math.min(out.length - start, Math.round(e.d * sr));
  const atk = Math.max(1, (e.attack ?? 0.003) * sr);
  const glide = e.glide ?? e.d;
  let ph = 0;
  const parts = e.partials ?? [];
  for (let i = 0; i < n; i++) {
    const tt = i / sr;
    let f = e.to ? e.f * (e.to / e.f) ** Math.min(1, tt / glide) : e.f;
    if (e.vib) f *= 2 ** ((Math.sin(2 * Math.PI * e.vib[0] * tt) * e.vib[1]) / 1200);
    ph += f / sr;
    const env = Math.min(1, i / atk) * Math.exp((-6.9 * tt) / e.d);
    let v = wave(e.wave ?? 'sine', ph);
    for (const [ratio, lvl, scale] of parts) v += lvl * Math.sin(2 * Math.PI * ph * ratio) * Math.exp((-6.9 * tt) / (e.d * scale));
    const trem = e.trem ? 1 - e.trem[1] * (0.5 + 0.5 * Math.sin(2 * Math.PI * e.trem[0] * tt)) : 1;
    out[start + i] += e.g * env * trem * v;
  }
}

function addNoise(out: Float32Array, sr: number, e: Noise, rand: () => number): void {
  const start = Math.round(e.t * sr);
  const n = Math.min(out.length - start, Math.round(e.d * sr));
  // one-pole coefficients
  const aLo = Math.exp((-2 * Math.PI * e.lo) / sr);
  const aHi = Math.exp((-2 * Math.PI * e.hi) / sr);
  const grainDecay = Math.exp(-1 / (0.006 * sr));
  let lpHi = 0, lpLo = 0, grain = 0;
  for (let i = 0; i < n; i++) {
    const tt = i / e.d / sr;
    const x = rand() * 2 - 1;
    lpHi = (1 - aHi) * x + aHi * lpHi; // low-pass at hi
    lpLo = (1 - aLo) * lpHi + aLo * lpLo; // its low end
    const band = lpHi - lpLo;
    const env = e.shape === 'swell' ? Math.sin(Math.PI * Math.min(1, tt)) ** 1.5 : Math.min(1, i / (0.001 * sr)) * Math.exp(-6.9 * tt);
    let amp = 1;
    if (e.grains) {
      if (rand() < e.grains / sr) grain = 0.6 + 0.4 * rand();
      grain *= grainDecay;
      amp = 0.35 + 0.9 * grain;
    }
    out[start + i] += e.g * env * amp * band * 3;
  }
}

/** Length of a recipe (s), with a short tail. */
export const durationOf = (id: SynthId): number => Math.max(...RECIPES[id].map((e) => e.t + e.d)) + 0.02;

/** The placeholder of `id` as mono samples at `sr`, peaking at 0.8, with a 5 ms fade at the end (no click). */
export function render(id: SynthId, sr: number): Float32Array {
  const out = new Float32Array(Math.ceil(durationOf(id) * sr));
  const rand = seeded(id);
  for (const e of RECIPES[id]) {
    if (e.kind === 'tone') addTone(out, sr, e);
    else addNoise(out, sr, e, rand);
  }
  let peak = 0;
  for (const v of out) peak = Math.max(peak, Math.abs(v));
  const k = peak > 0 ? 0.8 / peak : 0;
  const fade = Math.round(0.005 * sr);
  for (let i = 0; i < out.length; i++) out[i] *= k * Math.min(1, (out.length - 1 - i) / fade);
  return out;
}
