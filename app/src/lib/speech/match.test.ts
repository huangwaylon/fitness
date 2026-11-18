import { describe, expect, it } from 'vitest';
import { matchOf, micMiss, takeMiss, wav16k, wordsOf } from './match.ts';

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
});
