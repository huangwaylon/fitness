// The mic probe's pure half (steps.ts): the input's class from a label, levels, a click's onset, the WAV, the end of
// speech, the error's closed set; and the pinned sentences exist in the ladders.
import { describe, expect, it } from 'vitest';
import { SENTENCES, dbfs, inputClass, onset, silenceAfterSpeech, sttErr, wav16k, werPct } from './steps.ts';
import LADDER from '#lib/kikimimi/levels/parts/ladder.json';

describe('the probe’s measures', () => {
  it('classes an input by its label', () => {
    expect(['iPhone Microphone', '', 'AirPods Pro', 'Headphones', 'USB Audio CODEC', 'Bluetooth Headset', 'Something'].map(inputClass))
      .toEqual(['builtin', 'builtin', 'bluetooth', 'wired', 'wired', 'bluetooth', 'other']);
  });

  it('levels in dBFS and a click’s onset above the floor', () => {
    const x = new Float32Array(1000).fill(0.001);
    expect(Math.round(dbfs(x))).toBe(-60);
    expect(dbfs(new Float32Array(10))).toBe(-120);
    x[700] = 0.5;
    expect([onset(x, 0, -60), onset(x, 701, -60)]).toEqual([700, -1]);
  });

  it('writes a 16 kHz 16-bit mono WAV, averaged down', () => {
    const b = wav16k(new Float32Array(48_000).fill(0.5), 48_000);
    const v = new DataView(b.buffer);
    expect(String.fromCharCode(...b.subarray(0, 4), ...b.subarray(8, 12))).toBe('RIFFWAVE');
    expect([v.getUint32(24, true), v.getUint16(22, true), v.getUint16(34, true), v.getUint32(40, true), b.length]).toEqual([16000, 1, 16, 32_000, 32_044]);
    expect(v.getInt16(44, true)).toBe(16384);
  });

  it('ends a take after speech and then quiet, never on quiet alone', () => {
    const end = silenceAfterSpeech(300);
    expect([end(-60, 200), end(-60, 200), end(-20, 100), end(-60, 200), end(-60, 200)]).toEqual([false, false, false, false, true]);
  });

  it('maps errors to the closed set; a WER as a percentage', () => {
    expect([sttErr('not-allowed'), sttErr('language-not-supported'), sttErr(undefined)]).toEqual(['not-allowed', 'other', 'other']);
    expect(werPct(0.12345)).toBe(12.3);
  });

  it('pins 3 sentences that are clips of the ladders’ 1.0× rung, without digits', () => {
    const part = LADDER as unknown as { ladders: { id: string; line: { en: string } }[]; clips: Record<string, unknown> };
    for (const s of SENTENCES) {
      expect(s.clip).toBe(`${s.ladder}-2`);
      expect(part.clips[s.clip]).toBeDefined();
      expect(part.ladders.find((l) => l.id === s.ladder)?.line.en).toMatch(/^[^0-9]+$/);
    }
  });
});
