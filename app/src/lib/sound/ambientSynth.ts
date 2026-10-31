// The island's ambience beds, procedural (docs/design.md#ambience): original loops rendered as raw mono samples (pure:
// no AudioContext, deterministic per bed), so the island has its surf, birds and insects without any recorded file.
// Each bed is a seamless loop: continuous noise is rendered a little longer and its tail crossfaded into its head;
// calls (a bird, a cicada's phrase, a cricket's trill) are written into a circular buffer, so one that runs past the
// end carries on at the start. A file in static/audio/manifest.json `ambient.<id>` replaces a bed.
// Rendered at RATE (22.05 kHz: everything here sits under 8 kHz) when the bed is first asked for, then kept.
import type { AmbientId, BedVariant } from './ambient.ts';
import { mulberry32 } from '#lib/random.ts';

/** The beds' sample rate: half of a phone's, so a 40 s bed is 1.8 MB of samples. */
export const RATE = 22_050;

const TAU = Math.PI * 2;
/** Loop length (s) per bed: long enough that the pattern isn't heard repeating under the music. */
const LENGTH: Record<AmbientId, number> = { waves: 24, wind: 20, rain: 12, birds: 40, cicadas: 16, higurashi: 30, crickets: 14 };
const XFADE = 1;

/** One-pole low-pass coefficient for a cutoff (Hz). */
const lpK = (hz: number, sr: number) => 1 - Math.exp((-TAU * hz) / sr);

/** RBJ band-pass (constant peak gain), as a stateful step function. */
function bandpass(hz: number, q: number, sr: number) {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  let b0 = 0, b2 = 0, a1 = 0, a2 = 0;
  const set = (f: number) => {
    const w = (TAU * f) / sr, alpha = Math.sin(w) / (2 * q), a0 = 1 + alpha;
    b0 = alpha / a0;
    b2 = -alpha / a0;
    a1 = (-2 * Math.cos(w)) / a0;
    a2 = (1 - alpha) / a0;
  };
  set(hz);
  const step = (x: number) => {
    const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
  return Object.assign(step, { set });
}

/** Render `n + xfade` samples with `f(i)` and fold the tail into the head (equal power): a seamless loop of `n`. */
function looped(n: number, sr: number, f: (i: number) => number): Float32Array {
  const x = Math.round(XFADE * sr);
  const raw = new Float32Array(n + x);
  for (let i = 0; i < raw.length; i++) raw[i] = f(i);
  const out = raw.slice(0, n);
  for (let i = 0; i < x; i++) {
    const a = i / x;
    out[i] = raw[i] * Math.sin((a * Math.PI) / 2) + raw[n + i] * Math.cos((a * Math.PI) / 2);
  }
  return out;
}

/** Add `v` at `i` into a circular buffer. */
const put = (out: Float32Array, i: number, v: number) => {
  out[((i % out.length) + out.length) % out.length] += v;
};

/** A tone into a circular buffer: frequency `f(t)` (Hz), amplitude `a(t)`, for `d` s from `t0` s, with a little of the
 *  2nd and 3rd harmonics (`h2`, `h3`). */
function voice(out: Float32Array, sr: number, t0: number, d: number, f: (t: number) => number, a: (t: number) => number, h2 = 0.12, h3 = 0.04): void {
  const s = Math.round(t0 * sr), n = Math.round(d * sr);
  let ph = 0;
  const nyq = sr * 0.45;
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const fr = f(t);
    ph += fr / sr;
    const p = TAU * ph;
    // harmonics only under the Nyquist (no aliasing)
    put(out, s + i, a(t) * (Math.sin(p) + (2 * fr < nyq ? h2 * Math.sin(2 * p) : 0) + (3 * fr < nyq ? h3 * Math.sin(3 * p) : 0)));
  }
}

/** A soft attack and release envelope over `d` s. */
const env = (d: number, atk: number, rel: number) => (t: number) => Math.min(1, t / atk, Math.max(0, (d - t) / rel));

/** A short room: two quiet, darker echoes (the calls sound out of doors, not in the ear). */
function room(buf: Float32Array, sr: number, taps: [number, number][] = [[0.11, 0.28], [0.27, 0.16], [0.46, 0.08]]): Float32Array {
  const out = buf.slice();
  for (const [s, g] of taps) {
    const dly = Math.round(s * sr), k = lpK(2500, sr);
    let lp = 0;
    // the filter runs in from the loop's last second, so the echo's start continues its end
    for (let i = -sr; i < buf.length; i++) {
      lp += k * (buf[(i + buf.length) % buf.length] - lp);
      if (i >= 0) put(out, i + dly, g * lp);
    }
  }
  return out;
}

/** The surf: a low rumble that never stops, and waves (one every 5–8 s) that swell, break into foam and wash back. */
function waves(sr: number, r: () => number): Float32Array {
  const n = Math.round(LENGTH.waves * sr);
  // the swells, placed around the loop
  const body = new Float32Array(n), fizz = new Float32Array(n);
  for (let t = r() * 2; t < LENGTH.waves; t += 5 + r() * 3) {
    const g = 0.6 + r() * 0.4, rise = 1.6 + r() * 0.8, fall = 2.6 + r() * 1.2;
    for (let i = 0; i < (rise + fall * 2) * sr; i++) {
      const s = i / sr;
      const e = s < rise ? Math.sin(((s / rise) * Math.PI) / 2) ** 2 : Math.exp(-(s - rise) / fall);
      put(body, Math.round(t * sr) + i, g * e);
      // the foam fizzes just after the crest and dies a little faster
      const sf = s - rise * 0.85;
      put(fizz, Math.round(t * sr) + i, sf < 0 ? 0 : g * Math.sin((Math.min(1, sf / 0.7) * Math.PI) / 2) ** 2 * Math.exp(-sf / (fall * 0.7)));
    }
  }
  const kr1 = lpK(180, sr), kb1 = lpK(700, sr), kbh = lpK(160, sr), kf1 = lpK(5500, sr), kfh = lpK(1400, sr);
  let r1 = 0, r2 = 0, b1 = 0, b2 = 0, bh = 0, f1 = 0, fh = 0;
  return looped(n, sr, (i) => {
    const w = r() * 2 - 1;
    r1 += kr1 * (w - r1);
    r2 += kr1 * (r1 - r2);
    b1 += kb1 * (w - b1);
    b2 += kb1 * (b1 - b2);
    bh += kbh * (b2 - bh);
    f1 += kf1 * (w - f1);
    fh += kfh * (f1 - fh);
    const j = i % n;
    return 2.2 * r2 + 1.6 * (b2 - bh) * (0.15 + body[j]) + 0.55 * (f1 - fh) * fizz[j];
  });
}

/** Winter wind: dark noise through a band that drifts, in slow gusts (whole cycles per loop, so it loops). */
function wind(sr: number, r: () => number): Float32Array {
  const n = Math.round(LENGTH.wind * sr), L = LENGTH.wind;
  const bp = bandpass(400, 1.4, sr), bp2 = bandpass(900, 3, sr);
  const p1 = r() * TAU, p2 = r() * TAU, p3 = r() * TAU;
  const kl = lpK(140, sr);
  let lo = 0;
  return looped(n, sr, (i) => {
    const t = i / sr;
    const gust = 0.55 + 0.3 * Math.sin((TAU * 3 * t) / L + p1) + 0.15 * Math.sin((TAU * 7 * t) / L + p2);
    if (i % 64 === 0) {
      bp.set(380 + 220 * Math.sin((TAU * 2 * t) / L + p3) + 90 * Math.sin((TAU * 5 * t) / L + p1));
      bp2.set(800 + 300 * Math.sin((TAU * 3 * t) / L + p2));
    }
    const w = r() * 2 - 1;
    lo += kl * (w - lo);
    return gust * (1.1 * bp(w) + 0.25 * gust * gust * bp2(w)) + 1.8 * lo;
  });
}

/** Rain: a steady hiss, with drops ticking on leaves and on the ground. */
function rain(sr: number, r: () => number): Float32Array {
  const n = Math.round(LENGTH.rain * sr);
  const drops = new Float32Array(n);
  // ~70 drops a second: short bursts of bright noise, a few with a little pitched "plip"
  for (let k = 0; k < LENGTH.rain * 70; k++) {
    const s = Math.round(r() * n), g = 0.05 + r() ** 2 * 0.35, d = Math.round((0.002 + r() * 0.006) * sr);
    const bp = bandpass(1800 + r() * 3500, 2, sr);
    for (let i = 0; i < d * 4; i++) put(drops, s + i, g * bp((r() * 2 - 1) * Math.exp(-i / d)));
    if (r() < 0.08) {
      const f0 = 1400 + r() * 1800;
      voice(drops, sr, s / sr, 0.03, (t) => f0 * (1 - t * 6), (t) => 0.08 * g * Math.exp(-t / 0.008), 0, 0);
    }
  }
  const kh = lpK(1200, sr), kl = lpK(6500, sr), kb = lpK(500, sr);
  let h = 0, l = 0, b = 0;
  return looped(n, sr, (i) => {
    const w = r() * 2 - 1;
    l += kl * (w - l);
    h += kh * (l - h);
    b += kb * (w - b);
    return 0.5 * (l - h) + 0.5 * b + drops[i % n];
  });
}

/** One bird's call at `t` s, `g` loud (a far one is quieter). Japanese garden birds, after their calls, not any
 *  recording: the sparrow's chun-chun, the white-eye's twitter, the bulbul's loud piiyo, the bush warbler's
 *  hoo-hokekyo, the great tit's tsupi-tsupi. */
type Bird = (out: Float32Array, sr: number, t: number, g: number, r: () => number) => number;
const sparrow: Bird = (out, sr, t, g, r) => {
  let at = t;
  for (let k = 0, m = 2 + Math.floor(r() * 4); k < m; k++) {
    const d = 0.06 + r() * 0.04, f0 = 4300 + r() * 600, f1 = 3000 + r() * 400;
    voice(out, sr, at, d, (s) => f0 + (f1 - f0) * (s / d) ** 0.6, (s) => g * env(d, 0.008, 0.03)(s) * (1 + 0.5 * Math.sin(TAU * 90 * s)), 0.3, 0.1);
    at += d + 0.12 + r() * 0.16;
  }
  return at - t;
};
const whiteEye: Bird = (out, sr, t, g, r) => {
  let at = t;
  for (let k = 0, m = 6 + Math.floor(r() * 10); k < m; k++) {
    const d = 0.03 + r() * 0.03, f0 = 5200 + r() * 1400, up = r() < 0.5;
    voice(out, sr, at, d, (s) => f0 * (1 + (up ? 0.18 : -0.18) * (s / d)), (s) => g * 0.7 * env(d, 0.004, 0.012)(s), 0.08, 0);
    at += d + 0.015 + r() * 0.04;
  }
  return at - t;
};
const bulbul: Bird = (out, sr, t, g, r) => {
  const d = 0.45 + r() * 0.15, f0 = 2400 + r() * 300;
  // "pii": up and held, "yo": down
  voice(out, sr, t, d, (s) => (s < d * 0.55 ? f0 + 900 * Math.sin(((s / (d * 0.55)) * Math.PI) / 2) : f0 + 900 - 1500 * ((s - d * 0.55) / (d * 0.45))),
    (s) => g * env(d, 0.03, 0.08)(s), 0.25, 0.06);
  return d;
};
const warbler: Bird = (out, sr, t, g) => {
  // hoo: a long soft whistle, then ho-ke-kyo
  voice(out, sr, t, 1.1, (s) => 1050 + 120 * s, (s) => g * env(1.1, 0.25, 0.12)(s), 0.06, 0.02);
  voice(out, sr, t + 1.35, 0.14, () => 1650, (s) => g * env(0.14, 0.01, 0.04)(s), 0.1, 0);
  voice(out, sr, t + 1.52, 0.11, (s) => 2500 - 1800 * s, (s) => g * env(0.11, 0.008, 0.03)(s), 0.1, 0);
  voice(out, sr, t + 1.66, 0.42, (s) => 2900 - 900 * (s / 0.42) + 60 * Math.sin(TAU * 18 * s), (s) => g * env(0.42, 0.01, 0.2)(s), 0.12, 0.03);
  return 2.1;
};
const greatTit: Bird = (out, sr, t, g, r) => {
  let at = t;
  for (let k = 0, m = 3 + Math.floor(r() * 3); k < m; k++) {
    voice(out, sr, at, 0.09, () => 5600, (s) => g * 0.8 * env(0.09, 0.006, 0.03)(s), 0.05, 0);
    voice(out, sr, at + 0.11, 0.12, (s) => 3400 - 800 * (s / 0.12), (s) => g * 0.8 * env(0.12, 0.006, 0.05)(s), 0.1, 0);
    at += 0.38 + r() * 0.06;
  }
  return at - t;
};
/** The birds about in a season, with their shares. */
const FLOCK: Record<BedVariant, [Bird, number][]> = {
  spring: [[sparrow, 4], [whiteEye, 3], [warbler, 1.4], [greatTit, 1.5], [bulbul, 1]],
  summer: [[sparrow, 4], [bulbul, 1.5], [greatTit, 1], [whiteEye, 1]],
  autumn: [[sparrow, 4], [bulbul, 2.5], [whiteEye, 2], [greatTit, 1]],
  winter: [[sparrow, 4], [bulbul, 2], [whiteEye, 1.5]]
};

function birds(sr: number, r: () => number, v: BedVariant): Float32Array {
  const out = new Float32Array(Math.round(LENGTH.birds * sr));
  const flock = FLOCK[v], total = flock.reduce((s, [, w]) => s + w, 0);
  let warblers = 0;
  for (let t = r() * 2; t < LENGTH.birds - 1; ) {
    let x = r() * total, b = flock[0][0];
    for (const [bird, w] of flock) if ((x -= w) <= 0) { b = bird; break; }
    if (b === warbler && warblers++ >= 2) b = sparrow; // the bush warbler sings now and then, not on repeat
    const near = r();
    const d = b(out, sr, t, 0.25 + 0.75 * near * near, r);
    t += d + 0.8 + r() * 3.2;
  }
  return room(out, sr);
}

/** Summer cicadas: the large brown cicada's sizzling ジー (bright noise in fast rough pulses, a few at different
 *  distances, swelling and easing) under a robust cicada's ミーンミンミン now and then. */
function cicadas(sr: number, r: () => number): Float32Array {
  const n = Math.round(LENGTH.cicadas * sr), L = LENGTH.cicadas;
  const out = new Float32Array(n);
  // minminzemi: a phrase of rising "min"s, once or twice a loop
  for (let k = 0, t = 2 + r() * 3; k < 2; k++, t += 7 + r() * 2) {
    const mins = 6 + Math.floor(r() * 4), rate = 3.2, d = mins / rate + 1;
    const g = 0.18 + r() * 0.1;
    voice(out, sr, t, d, (s) => 3200 + 500 * ((s * rate) % 1) ** 0.5, (s) => {
      const ph = (s * rate) % 1;
      return g * env(d, 0.4, 0.8)(s) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, ph * 1.4)) ** 2) * (0.6 + 0.4 * Math.sin(TAU * 140 * s) ** 2);
    }, 0.35, 0.15);
  }
  const bps = [bandpass(4600, 2.5, sr), bandpass(5400, 3, sr), bandpass(3900, 2.5, sr)];
  const gains = [0.9, 0.55, 0.35];
  const rate = [83, 97, 71];
  const ph = [r() * TAU, r() * TAU, r() * TAU];
  return looped(n, sr, (i) => {
    const t = i / sr;
    let v = 0;
    for (let c = 0; c < 3; c++) {
      const w = r() * 2 - 1;
      // a rough pulse train: each pulse a quick tick of noise
      const pulse = Math.max(0, Math.sin(TAU * rate[c] * t + ph[c])) ** 3;
      const swell = 0.6 + 0.4 * Math.sin((TAU * (c + 1) * t) / L + ph[c]);
      v += gains[c] * swell * pulse * bps[c](w);
    }
    return 1.6 * v + out[i % n];
  });
}

/** Higurashi at dawn and dusk: カナカナカナ… phrases of quick, bright pulses that fall in pitch and fade, answered from
 *  further off, in a wide space. */
function higurashi(sr: number, r: () => number): Float32Array {
  const out = new Float32Array(Math.round(LENGTH.higurashi * sr));
  for (let t = r(); t < LENGTH.higurashi - 1; ) {
    const near = r(), g = 0.25 + 0.75 * near * near;
    const pulses = 18 + Math.floor(r() * 22), rate = 13 + r() * 4, d = pulses / rate;
    const f0 = 4300 + r() * 500;
    voice(out, sr, t, d + 0.1, (s) => f0 * (1 - 0.1 * (s / d)) * (1 + 0.04 * Math.max(0, Math.sin(TAU * rate * s))), (s) => {
      const p = (s * rate) % 1;
      const shape = Math.min(1, s / 0.6) * Math.max(0, 1 - Math.max(0, s - d * 0.4) / (d * 0.6));
      return g * shape * (p < 0.55 ? Math.sin((Math.PI * p) / 0.55) ** 2 : 0);
    }, 0.15, 0.03);
    t += d + 1.2 + r() * 3.5;
  }
  return room(out, sr, [[0.14, 0.32], [0.33, 0.22], [0.58, 0.14], [0.9, 0.08]]);
}

/** Autumn nights: bell crickets (suzumushi) ringing リーン in trilled phrases and field crickets (enma-korogi) chirping
 *  コロコロリー, a few of each at different pitches and distances. */
function crickets(sr: number, r: () => number): Float32Array {
  const out = new Float32Array(Math.round(LENGTH.crickets * sr));
  // suzumushi
  for (let c = 0; c < 3; c++) {
    const f = 4100 + c * 260 + r() * 120, g = [0.5, 0.3, 0.18][c], trill = 38 + r() * 10;
    for (let t = r() * 2; t < LENGTH.crickets; t += 1.1 + r() * 1.4) {
      const d = 0.35 + r() * 0.45;
      voice(out, sr, t, d, () => f, (s) => g * env(d, 0.03, 0.08)(s) * (0.4 + 0.6 * Math.sin(Math.PI * ((s * trill) % 1)) ** 2), 0.04, 0);
    }
  }
  // enma-korogi
  for (let c = 0; c < 2; c++) {
    const f = 3700 + c * 350 + r() * 100, g = [0.35, 0.2][c];
    for (let t = r() * 3; t < LENGTH.crickets; t += 2 + r() * 2.5) {
      const pulses = 3 + Math.floor(r() * 4), rate = 28;
      for (let p = 0; p < pulses; p++) voice(out, sr, t + p / rate, 0.03, () => f, (s) => g * Math.sin((Math.PI * s) / 0.03) ** 2, 0.06, 0);
      const d = 0.5 + r() * 0.4, at = t + pulses / rate + 0.1;
      voice(out, sr, at, d, () => f * 1.02, (s) => g * 0.8 * env(d, 0.02, 0.2)(s) * (0.5 + 0.5 * Math.sin(Math.PI * ((s * 32) % 1)) ** 2), 0.05, 0);
    }
  }
  return room(out, sr, [[0.09, 0.2], [0.21, 0.1]]);
}

const SEED: Record<AmbientId, number> = { waves: 11, wind: 23, rain: 37, birds: 41, cicadas: 53, higurashi: 67, crickets: 79 };

/** A bed as mono samples at RATE, normalised to a 0.7 peak (the layer's gain in ambient.ts sets its level).
 *  `v`: the season (the birds). */
export function renderBed(id: AmbientId, v: BedVariant = 'spring', sr = RATE): Float32Array {
  const r = mulberry32(SEED[id] + (id === 'birds' ? ['spring', 'summer', 'autumn', 'winter'].indexOf(v) * 1000 : 0));
  const out =
    id === 'waves' ? waves(sr, r)
    : id === 'wind' ? wind(sr, r)
    : id === 'rain' ? rain(sr, r)
    : id === 'birds' ? birds(sr, r, v)
    : id === 'cicadas' ? cicadas(sr, r)
    : id === 'higurashi' ? higurashi(sr, r)
    : crickets(sr, r);
  // no DC, then a 0.7 peak
  let mean = 0;
  for (const x of out) mean += x;
  mean /= out.length;
  let peak = 0;
  for (let i = 0; i < out.length; i++) peak = Math.max(peak, Math.abs((out[i] -= mean)));
  const k = peak > 0 ? 0.7 / peak : 0;
  for (let i = 0; i < out.length; i++) out[i] *= k;
  return out;
}
