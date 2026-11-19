import { describe, expect, it } from 'vitest';
import { matchOf, micMiss, takeMiss, trimSilence, wav16k, wordsOf } from './match.ts';

describe('speech test: the take and the match', () => {
  it('a WAV the relay takes: RIFF/WAVE, 16 kHz mono 16-bit, capped at 10 s', () => {
    const w = wav16k(new Float32Array(16_000 * 12).fill(0.5));
    const v = new DataView(w.buffer);
    expect(String.fromCharCode(...w.subarray(0, 4), ...w.subarray(8, 12))).toBe('RIFFWAVE');
    expect([v.getUint16(22, true), v.getUint32(24, true), v.getUint16(34, true)]).toEqual([1, 16_000, 16]);
    expect(w.length).toBe(44 + 16_000 * 10 * 2);
    expect(v.getInt16(44, true)).toBe(16_384);
  });
  it('words: case, punctuation and contractions don’t count', () => {
    expect(wordsOf("I'd like a coffee, please!")).toEqual(['i', 'would', 'like', 'a', 'coffee', 'please']);
    expect(wordsOf('I’m gonna go.')).toEqual(['i', 'am', 'going', 'to', 'go']);
  });
  it('the share heard, each asked word marked', () => {
    expect(matchOf('Can I have a coffee, please?', 'can i have a coffee please').score).toBe(1);
    const m = matchOf('Where is the train station?', 'where is the rain station');
    expect(m.score).toBe(0.8);
    expect(m.words.filter((w) => !w.ok).map((w) => w.w)).toEqual(['train']);
    expect(matchOf('Good morning.', '').score).toBe(0);
    expect(matchOf('Good morning.', 'good morning good morning good morning').score).toBe(0);
  });
  it("getUserMedia's errors in the test's words; WebKit's audio-session refusal its own", () => {
    expect(['NotAllowedError', 'NotFoundError', 'OverconstrainedError', 'NotReadableError', 'AbortError', 'InvalidStateError', 'SecurityError', 'TypeError', 'Weird', undefined].map(micMiss))
      .toEqual(['refused', 'nomic', 'nomic', 'busy', 'busy', 'session', 'insecure', 'insecure', 'other', 'other']);
  });

  it('a take not worth sending: under 0.3 s, or all zeros (a muted mic); a quiet room is sent', () => {
    expect(takeMiss(new Float32Array(16_000 * 0.2).fill(0.3))).toBe('empty');
    expect(takeMiss(new Float32Array(0))).toBe('empty');
    expect(takeMiss(new Float32Array(16_000))).toBe('silent');
    const quiet = new Float32Array(16_000);
    quiet[500] = 0.002;
    expect(takeMiss(quiet)).toBeNull();
  });

  describe('trimSilence: the silence at either end, never the speech', () => {
    const R = 16_000;
    // a seeded hiss (a room's floor, a fricative), a vowel as a tone
    let seed = 7;
    const rnd = () => ((seed = (seed * 1_103_515_245 + 12_345) % 2 ** 31) / 2 ** 31) * 2 - 1;
    type Part = [s: number, kind: 'hiss' | 'tone', amp: number];
    const take = (parts: Part[]) => {
      const out: number[] = [], at: number[] = [];
      for (const [s, kind, amp] of parts) {
        at.push(out.length);
        for (let i = 0; i < Math.round(s * R); i++) out.push(kind === 'hiss' ? rnd() * amp : Math.sin((2 * Math.PI * 180 * out.length) / R) * amp);
      }
      return { x: Float32Array.from(out), at: [...at, out.length] };
    };
    const room = 0.001;

    it('cuts the wait before and the pause after, keeping a soft onset, a pause between words and a soft end, padded', () => {
      // wait · "h" (−40 dB of the vowel) · vowel · pause · a quiet word (−25 dB) · vowel · "s" (−35 dB) · pause
      const { x, at } = take([[0.9, 'hiss', room], [0.08, 'hiss', 0.005], [0.3, 'tone', 0.5], [0.25, 'hiss', room], [0.2, 'tone', 0.03], [0.3, 'tone', 0.4], [0.12, 'hiss', 0.009], [1.3, 'hiss', room]]);
      const y = trimSilence(x);
      const from = y.byteOffset / 4, to = from + y.length;
      expect(y.buffer).toBe(x.buffer);
      // all of the speech kept (the "h" through the "s"), with no more than the padding beyond it
      expect(from).toBeLessThanOrEqual(at[1]);
      expect(to).toBeGreaterThanOrEqual(at[7]);
      expect(at[2] - from).toBeLessThanOrEqual(0.3 * R + 320);
      expect(to - at[7]).toBeLessThanOrEqual(0.4 * R + 320);
      // ~1.4 s of the 3.45 s gone
      expect(x.length - y.length).toBeGreaterThan(1.2 * R);
    });

    it('speech to the very ends, a room louder than the gate, or nothing loud: the take as it was', () => {
      for (const parts of [
        [[0.5, 'tone', 0.4], [0.2, 'hiss', room], [0.5, 'tone', 0.4]],
        [[0.6, 'hiss', 0.05], [0.5, 'tone', 0.3], [0.6, 'hiss', 0.05]],
        [[1, 'hiss', 0.0015]],
        [[0.01, 'tone', 0.5]]
      ] as Part[][]) {
        const { x } = take(parts);
        expect(trimSilence(x)).toBe(x);
      }
    });

    it('a short sound in a long silence keeps its padding (≥ 0.7 s), never less than takeMiss sends', () => {
      const { x } = take([[2, 'hiss', room], [0.06, 'tone', 0.3], [2, 'hiss', room]]);
      const y = trimSilence(x);
      expect(y.length).toBeGreaterThanOrEqual(0.76 * R - 640);
      expect(takeMiss(y)).toBeNull();
    });
  });
});
