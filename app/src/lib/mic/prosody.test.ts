// まねっこ's pitch and prosody (lib/mic/pitch.ts, prosody.ts) on synthetic signals with known answers: sines at known
// f0, a glide, silence and hiss, an octave slip, a 48 kHz clip brought down; syllable bursts with known nuclei, a rise
// against a fall, a narrow melody against a wide one, a line said faster, a lag; then one of our real clips
// (e2e/fixtures/mic/ladder-line.wav, sp-cat-2: "Hey, it's me. Long story, but, um, any chance you could feed my cat
// tomorrow?"), read by a tiny WAV parser, against itself and itself flattened.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { frames, medianF0, monoOf } from './pitch.ts';
import { compare, feedback, finalOf, pausesOf, rangeOf, reaction, trackOf } from './prosody.ts';
import { SR } from './vad.ts';

/** A voiced tone: a pulse-like harmonic stack at f0(t) Hz (Hz per sample, a function of seconds), amplitude a(t). */
function voice(s: number, f0: (t: number) => number, a: (t: number) => number = () => 0.3, sr = SR): Float32Array {
  const out = new Float32Array(Math.round(s * sr));
  let ph = 0;
  for (let i = 0; i < out.length; i++) {
    const t = i / sr;
    ph += (2 * Math.PI * f0(t)) / sr;
    out[i] = a(t) * (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.25 * Math.sin(3 * ph));
  }
  return out;
}
const sine = (s: number, hz: number, sr = SR) => Float32Array.from({ length: Math.round(s * sr) }, (_, i) => 0.3 * Math.sin((2 * Math.PI * hz * i) / sr));
const silence = (s: number) => new Float32Array(Math.round(s * SR));
function noise(s: number, a: number, seed = 7): Float32Array {
  let x = seed;
  return Float32Array.from({ length: Math.round(s * SR) }, () => ((x = (x * 1103515245 + 12345) & 0x7fffffff), a * ((x / 0x7fffffff) * 2 - 1)));
}
const cat = (...xs: Float32Array[]) => {
  const out = new Float32Array(xs.reduce((n, x) => n + x.length, 0));
  let at = 0;
  for (const x of xs) out.set(x, at), (at += x.length);
  return out;
};
/** `n` syllables of `syl` s with `gap` s of quiet between, the melody f0(t) over the whole. */
const syllables = (n: number, syl: number, gap: number, f0: (t: number) => number = () => 140) =>
  voice(n * (syl + gap), f0, (t) => {
    const p = t % (syl + gap);
    return p < syl ? 0.3 * Math.sin((Math.PI * p) / syl) : 0;
  });
const voicedF0 = (x: Float32Array) => [...frames(x).f0].filter((f) => f > 0);

/** A 16-bit PCM WAV's samples (mono) and rate: the fmt and data chunks, any others skipped. */
function wav(buf: Buffer): { x: Float32Array; sr: number } {
  let at = 12, sr = 0, ch = 1, bits = 16;
  while (at + 8 <= buf.length) {
    const id = buf.toString('ascii', at, at + 4), n = buf.readUInt32LE(at + 4), body = at + 8;
    if (id === 'fmt ') (ch = buf.readUInt16LE(body + 2)), (sr = buf.readUInt32LE(body + 4)), (bits = buf.readUInt16LE(body + 14));
    if (id === 'data') {
      expect(bits).toBe(16);
      const frames = Math.floor(n / 2 / ch), x = new Float32Array(frames);
      for (let i = 0; i < frames; i++) x[i] = buf.readInt16LE(body + i * 2 * ch) / 32768;
      return { x, sr };
    }
    at = body + n + (n & 1);
  }
  throw new Error('no data chunk');
}

describe('pitch: YIN f0', () => {
  it('sines and harmonic tones at a known f0, within 1.5%', () => {
    for (const hz of [90, 140, 220, 330]) {
      for (const x of [sine(0.5, hz), voice(0.5, () => hz)]) {
        const f = voicedF0(x);
        expect(f.length).toBeGreaterThan(40);
        expect(Math.abs(medianF0(Float32Array.from(f)) - hz) / hz).toBeLessThan(0.015);
      }
    }
  });
  it('a glide from 120 to 240 Hz rises frame by frame', () => {
    const f = voicedF0(voice(1, (t) => 120 + 120 * t));
    expect(f[0]).toBeLessThan(135);
    expect(f.at(-1)!).toBeGreaterThan(220);
    expect(f.every((v, k) => k < 3 || v >= f[k - 3] - 1)).toBe(true);
  });
  it('silence and hiss are unvoiced; out of range (40 Hz, 900 Hz) unvoiced or folded', () => {
    expect(voicedF0(silence(0.5))).toHaveLength(0);
    expect(voicedF0(noise(0.5, 0.2)).length).toBeLessThan(5);
    expect(voicedF0(sine(0.5, 40))).toHaveLength(0);
  });
  it('a quiet tail under the loudest frame by 30 dB is not voiced', () => {
    const f = frames(cat(voice(0.4, () => 150), voice(0.4, () => 150, () => 0.003))).f0;
    expect([...f.slice(-20)].every((v) => v === 0)).toBe(true);
  });
  it('an octave slip (a few frames at double) is folded back', () => {
    const x = voice(0.6, (t) => (t > 0.3 && t < 0.36 ? 300 : 150));
    expect(voicedF0(x).every((f) => f < 200)).toBe(true);
  });
  it('a 48 kHz clip comes to 16 kHz with its f0 kept', () => {
    const x = voice(0.5, () => 180, () => 0.3, 48_000);
    const buf = { numberOfChannels: 2, sampleRate: 48_000, length: x.length, getChannelData: () => x };
    const m = monoOf(buf);
    expect(Math.abs(m.length - 8000)).toBeLessThanOrEqual(2);
    expect(Math.abs(medianF0(frames(m).f0) - 180)).toBeLessThan(3);
  });
});

describe('prosody: the track', () => {
  it('syllable bursts: one nucleus each, the span from the first to the last', () => {
    const t = trackOf(cat(silence(0.3), syllables(6, 0.18, 0.08), silence(0.3)));
    expect(t.nuclei).toHaveLength(6);
    expect(t.a).toBeGreaterThanOrEqual(28);
    expect(t.a).toBeLessThan(36);
    expect(t.b).toBeGreaterThan(170);
    expect(t.b).toBeLessThan(190);
  });
  it('the melody in semitones from the speaker: a man an octave under a woman reads the same', () => {
    const glide = (base: number) => trackOf(voice(1, (t) => base * (1 + 0.4 * t)));
    expect(Math.abs(rangeOf(glide(100)) - rangeOf(glide(200)))).toBeLessThan(0.3);
  });
  it('the last 300 ms: a rise, a fall, level', () => {
    expect(finalOf(trackOf(voice(0.8, (t) => (t < 0.5 ? 150 : 150 + 200 * (t - 0.5)))))).toBe('rise');
    expect(finalOf(trackOf(voice(0.8, (t) => (t < 0.5 ? 200 : 200 - 200 * (t - 0.5)))))).toBe('fall');
    expect(finalOf(trackOf(voice(0.8, () => 160)))).toBe('flat');
  });
  it('pauses: a 0.4 s quiet inside the speech, not the 0.08 s between syllables', () => {
    expect(pausesOf(trackOf(syllables(5, 0.18, 0.08)))).toBe(0);
    expect(pausesOf(trackOf(cat(syllables(3, 0.18, 0.08), silence(0.4), syllables(3, 0.18, 0.08))))).toBe(1);
  });
});

describe('prosody: a take against the line', () => {
  /** A line: 6 syllables, the third the loudest, a wide melody ending in a rise. */
  /** The melody (semitones): up and down, then from 1 s on rising (`end` 1) or falling (−1) 15 semitones a second. */
  const tune = (end: number) => (t: number) => 140 * 2 ** ((t < 1 ? 4 * Math.sin(3 * t) : 4 * Math.sin(3) + end * 15 * (t - 1)) / 12);
  const melody = tune(1);
  const line = (speed = 1, f0 = melody, loud = 2) =>
    voice(1.56 / speed, (t) => f0(t * speed), (t) => {
      const u = t * speed, p = u % 0.26, k = Math.floor(u / 0.26);
      return p < 0.18 ? (k === loud ? 0.45 : 0.25) * Math.sin((Math.PI * p) / 0.18) : 0;
    });
  const ref = trackOf(line());

  it('the same line: in step, its pace, its melody, its rise: praise only, そっくり', () => {
    const o = compare(ref, trackOf(line()));
    expect(o.rate).toBeCloseTo(1, 1);
    expect(o.range).toBeCloseTo(1, 1);
    expect(o.final).toEqual({ ref: 'rise', you: 'rise' });
    expect(o.stress.hit).toBe(o.stress.of);
    const codes = feedback(o);
    expect(codes[0]).toBe('final');
    expect(reaction(codes)).toBe('close');
  });
  it('said 1.5× faster: 早口 is the tip, after a praise', () => {
    const o = compare(ref, trackOf(line(1.5)));
    expect(o.rate).toBeGreaterThan(1.3);
    expect(feedback(o)).toEqual([expect.any(String), 'fast']);
    expect(reaction(feedback(o))).toBe('good');
  });
  it('a flat voice: the range is the tip', () => {
    const o = compare(ref, trackOf(line(1, () => 140)));
    expect(o.range).toBeLessThan(0.6);
    expect(feedback(o)[1]).toBe('flat');
  });
  it('a fall where the line rises: the end to try', () => {
    const o = compare(ref, trackOf(line(1, tune(-1))));
    expect(o.final).toEqual({ ref: 'rise', you: 'fall' });
    expect(feedback(o)).toContain('finalTry');
  });
  it('shadowing: a small lag is praise, a long one the tip', () => {
    const you = trackOf(line());
    expect(feedback(compare(ref, you, 0.3))).toContain('keep');
    expect(feedback(compare(ref, you, 1.4))[1]).toBe('late');
  });
  it('nothing said: one line, 聞こえませんでした', () => {
    const o = compare(ref, trackOf(silence(1)));
    expect(o.heard).toBe(false);
    expect(feedback(o)).toEqual(['quiet']);
    expect(reaction(feedback(o))).toBe('quiet');
  });
});

describe('prosody: one of our clips', () => {
  const { x, sr } = wav(readFileSync(join(import.meta.dirname, '..', '..', '..', 'e2e', 'fixtures', 'mic', 'ladder-line.wav')));
  const clip = monoOf({ numberOfChannels: 1, sampleRate: sr, length: x.length, getChannelData: () => x });
  const t = trackOf(clip);

  it('a voice in its range, about a syllable per nucleus (19 syllables)', () => {
    const f = medianF0(frames(clip).f0);
    expect(f).toBeGreaterThan(80);
    expect(f).toBeLessThan(300);
    expect(t.voiced).toBeGreaterThan(100);
    expect(t.nuclei.length).toBeGreaterThanOrEqual(12);
    expect(t.nuclei.length).toBeLessThanOrEqual(26);
    expect(rangeOf(t)).toBeGreaterThan(3);
  });
  it('against itself: in step, its pace and melody; flattened to its median: the range to try', () => {
    const same = compare(t, trackOf(clip));
    expect(same.stress.hit).toBe(same.stress.of);
    expect(same.rate).toBeCloseTo(1, 2);
    expect(feedback(same).some((c) => c === 'flat' || c === 'fast' || c === 'slow')).toBe(false);
    // the clip's own envelope on one steady pitch: a monotone reading of the line
    const f0 = frames(clip).f0, env = frames(clip).db, flat = new Float32Array(clip.length);
    let ph = 0;
    for (let i = 0; i < clip.length; i++) {
      const k = Math.min(f0.length - 1, Math.floor(i / 160));
      ph += (2 * Math.PI * 120) / SR;
      flat[i] = f0[k] > 0 ? 10 ** (env[k] / 20) * Math.sin(ph) : 0;
    }
    expect(feedback(compare(t, trackOf(flat)))).toContain('flat');
  });
});
