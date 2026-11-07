// The mic's signal half (lib/mic/vad.ts) on synthetic signals: the 16 kHz decimator, the capped buffer, the VAD
// (a voiced tone is speech, hiss and silence aren't, a click doesn't start it, 300 ms gaps hold it, the silence after
// it ends the take) and the speech's span.
import { describe, expect, it } from 'vitest';
import { FRAME, HANG_MS, Pcm, SR, STOP_MS, To16k, Vad, frameStats, speechSpan } from './vad.ts';

/** `ms` of a sine at `hz`, amplitude `a`, at 16 kHz. */
const tone = (ms: number, hz = 180, a = 0.3) => Float32Array.from({ length: (ms * SR) / 1000 }, (_, i) => a * Math.sin((2 * Math.PI * hz * i) / SR));
const silence = (ms: number) => new Float32Array((ms * SR) / 1000);
/** Seeded white noise (amplitude `a`). */
function noise(ms: number, a: number, seed = 7): Float32Array {
  let s = seed;
  return Float32Array.from({ length: (ms * SR) / 1000 }, () => ((s = (s * 1103515245 + 12345) & 0x7fffffff), a * (s / 0x7fffffff * 2 - 1)));
}
const cat = (...xs: Float32Array[]) => {
  const out = new Float32Array(xs.reduce((n, x) => n + x.length, 0));
  let at = 0;
  for (const x of xs) out.set(x, at), (at += x.length);
  return out;
};

describe('To16k', () => {
  it('48 kHz to 16 kHz: a third of the samples, the level kept, across blocks of any size', () => {
    const r = new To16k(48_000), one = Float32Array.from({ length: 48_000 }, () => 0.5);
    const out = cat(r.push(one.subarray(0, 1000)), r.push(one.subarray(1000, 1001)), r.push(one.subarray(1001)));
    expect(Math.abs(out.length - 16_000)).toBeLessThanOrEqual(1);
    expect(out.every((v) => Math.abs(v - 0.5) < 1e-6)).toBe(true);
  });
  it('44.1 kHz: the fractional step comes out at 16 kHz', () => {
    const out = new To16k(44_100).push(new Float32Array(44_100));
    expect(Math.abs(out.length - 16_000)).toBeLessThanOrEqual(1);
  });
  it('16 kHz is passed through as a copy', () => {
    const x = tone(20), out = new To16k(SR).push(x);
    expect(out).toEqual(x);
    expect(out).not.toBe(x);
  });
});

describe('Pcm', () => {
  it('keeps up to its cap and drops the rest', () => {
    const p = new Pcm(500);
    p.push(new Float32Array(300).fill(1));
    expect(p.full).toBe(false);
    p.push(new Float32Array(300).fill(2));
    expect(p.length).toBe(500);
    expect(p.full).toBe(true);
    expect(p.slice(299, 301)).toEqual(Float32Array.from([1, 2]));
  });
});

describe('frameStats', () => {
  it('a voiced tone: loud, few zero crossings; noise: many; silence: −100 dB', () => {
    const v = frameStats(tone(20)), n = frameStats(noise(20, 0.3));
    expect(v.db).toBeGreaterThan(-15);
    expect(v.zcr).toBeLessThan(0.05);
    expect(n.zcr).toBeGreaterThan(0.42);
    expect(frameStats(silence(20)).db).toBe(-100);
  });
});

describe('Vad', () => {
  it('speech after quiet: heard, its span, then done after STOP_MS of quiet', () => {
    const v = new Vad();
    v.push(cat(noise(500, 0.001), tone(800)));
    expect(v.state).toMatchObject({ speaking: true, heard: true, done: false });
    expect(v.state.from).toBe(500 * 16);
    v.push(silence(STOP_MS - 40));
    expect(v.state.done).toBe(false);
    expect(v.state.speaking).toBe(false);
    v.push(silence(60));
    expect(v.state.done).toBe(true);
    expect(v.state.to).toBe(1300 * 16);
  });
  it('holds speech through a gap shorter than the hang', () => {
    const v = new Vad();
    v.push(cat(silence(200), tone(300), silence(HANG_MS - 40)));
    expect(v.state.speaking).toBe(true);
    v.push(tone(200));
    v.push(silence(HANG_MS + 20));
    expect(v.state.speaking).toBe(false);
    expect(v.state.done).toBe(false);
  });
  it('hiss, silence and a single click are not speech', () => {
    const v = new Vad();
    v.push(cat(silence(300), noise(1000, 0.3), silence(300)));
    const click = silence(FRAME / 16);
    click.fill(0.5, 0, FRAME);
    v.push(cat(click, silence(500)));
    expect(v.state).toMatchObject({ heard: false, speaking: false, done: false, from: -1 });
  });
  it('the floor follows the room: a soft voice that counts in a silent room doesn’t over a learnt hum', () => {
    const soft = () => tone(400, 180, 0.0112); // −42 dBFS
    const quiet = new Vad();
    quiet.push(cat(silence(1000), soft()));
    expect(quiet.state.heard).toBe(true);
    const hum = new Vad();
    hum.push(tone(3000, 60, 0.00355)); // −52 dBFS
    hum.push(soft());
    expect(hum.state.heard).toBe(false);
  });
});

describe('speechSpan', () => {
  it('pads 150 ms before and 200 ms after, clamped; none without speech', () => {
    expect(speechSpan({ from: 8000, to: 32_000 }, 64_000)).toEqual([8000 - 2400, 32_000 + 3200]);
    expect(speechSpan({ from: 100, to: 63_000 }, 64_000)).toEqual([0, 64_000]);
    expect(speechSpan({ from: -1, to: -1 }, 64_000)).toBeNull();
  });
});
