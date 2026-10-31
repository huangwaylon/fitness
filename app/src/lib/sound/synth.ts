// Procedural placeholder effects (docs/design.md#audio-files): original, short, NH-*inspired* sounds rendered as raw
// samples (pure: no AudioContext, deterministic per id), so the feature works before any audio file exists. Each is
// built from a few soft mallets, bells, glides and filtered noise. None of them copies a game melody: the jingles
// are plain arpeggios and the announcement chime is the generic Japanese PA ピンポンパンポン (F-A-C-F).
// A file in static/audio/manifest.json replaces the placeholder of its id.
import type { SoundId } from './ids.ts';
import { mulberry32 } from '#lib/random.ts';

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

const RECIPES: Record<SoundId, Ev[]> = {
  cursor: [{ kind: 'tone', f: hz(C7), t: 0, d: 0.045, g: 0.6, attack: 0.001, partials: [[2, 0.2, 0.5]] }],
  // "pi-pon": up a fifth
  confirm: [mallet(E6, 0, 0.16, 0.8), mallet(B6, 0.075, 0.24, 0.9)],
  // down a fourth, a little rounder
  cancel: [{ ...mallet(D6, 0, 0.14, 0.8), wave: 'tri' }, { ...mallet(G5, 0.07, 0.2, 0.8), wave: 'tri' }],
  'phone-open': [mallet(C6, 0, 0.2, 0.7), mallet(E6, 0.05, 0.2, 0.7), mallet(G6, 0.1, 0.2, 0.75), mallet(C7, 0.15, 0.36, 0.85)],
  'phone-close': [mallet(G6, 0, 0.15, 0.75), mallet(C6, 0.06, 0.26, 0.8)],
  'phone-app': [{ kind: 'tone', f: 600, to: 1300, glide: 0.05, t: 0, d: 0.09, g: 0.8, attack: 0.001 }, mallet(C7, 0.045, 0.2, 0.35)],
  // taps (docs/design.md#taps). select: one soft woody "pok" (lighter than the confirm's two notes)
  select: [{ ...mallet(A6, 0, 0.11, 0.9), wave: 'tri' }],
  // a switch: two quick notes up (on) / down (off), the off one rounder
  'toggle-on': [mallet(C6, 0, 0.07, 0.7), mallet(G6, 0.045, 0.12, 0.9)],
  'toggle-off': [{ ...mallet(G6, 0, 0.07, 0.75), wave: 'tri' }, { ...mallet(C6, 0.045, 0.12, 0.8), wave: 'tri' }],
  // a keypad key: a tiny "tok" (NH's text-entry keyboard), barely there
  key: [
    { kind: 'tone', f: 1700, to: 1250, glide: 0.02, t: 0, d: 0.035, g: 0.7, wave: 'tri', attack: 0.001 },
    { kind: 'noise', t: 0, d: 0.012, g: 0.25, lo: 2500, hi: 9000, shape: 'decay' }
  ],
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
  // remove: a soft "poof" of smoke
  poof: [
    { kind: 'noise', t: 0, d: 0.22, g: 1, lo: 250, hi: 1800, shape: 'swell' },
    { kind: 'tone', f: 560, to: 190, glide: 0.15, t: 0, d: 0.17, g: 0.35, wave: 'tri', attack: 0.004 }
  ],
  // undo: the app-open blip played backwards (a glide down), then a low note
  undo: [{ kind: 'tone', f: 1300, to: 600, glide: 0.06, t: 0, d: 0.1, g: 0.8, attack: 0.001 }, mallet(E6, 0.06, 0.18, 0.35)],
  // a voiced syllable: a short gliding tone with a couple of harmonics (pitch per character comes from the rate)
  'blip-host': [{ kind: 'tone', f: 560, to: 505, glide: 0.05, t: 0, d: 0.055, g: 0.9, wave: 'tri', attack: 0.004, partials: [[2, 0.35, 0.8], [3, 0.15, 0.6]] }],
  'blip-villager': [{ kind: 'tone', f: 300, to: 270, glide: 0.05, t: 0, d: 0.06, g: 0.7, wave: 'sq', attack: 0.004, partials: [[2, 0.3, 0.8]] }],
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
  // footsteps in sand (gritty), grass (soft) and snow (a squeaky crunch)
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
  // critters: a bobber's "pocha" (a quick falling blip and a little water), the reel's ratchet, an original catch tune
  // (four mallet notes up and a twinkle: not NH's), the net's airy swing and the balloon's "pan!" with a glint
  plop: [
    { kind: 'tone', f: 950, to: 260, glide: 0.05, t: 0, d: 0.1, g: 0.9, attack: 0.001 },
    { kind: 'noise', t: 0.02, d: 0.14, g: 0.35, lo: 600, hi: 3200, shape: 'decay', grains: 60 }
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
  ]
};

const seedOf = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

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
export const durationOf = (id: SoundId): number => Math.max(...RECIPES[id].map((e) => e.t + e.d)) + 0.02;

/** The placeholder of `id` as mono samples at `sr`, peaking at 0.8, with a 5 ms fade at the end (no click). */
export function render(id: SoundId, sr: number): Float32Array {
  const out = new Float32Array(Math.ceil(durationOf(id) * sr));
  const rand = mulberry32(seedOf(id));
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
