// The cue table (docs/design.md#cues): scenery taps are wired, quiet world sounds.
import { describe, expect, it } from 'vitest';
import { CUES } from './cues.ts';
import { SOUNDS, type SceneSfx } from './ids.ts';
import { durationOf } from './synth.ts';

// every kind sceneSfx() can ask for (the Record type makes the compiler list them all)
const KINDS: Record<SceneSfx, true> = {
  bush: true, flower: true, cloud: true, sun: true, moon: true, star: true, 'shooting-star': true,
  splash: true, fish: true, sand: true, grass: true, snow: true, balloon: true, butterfly: true,
  present: true, cast: true, plop: true, nibble: true, bite: true, reel: true, catch: true, flee: true, net: true, 'bug-flee': true
};

describe('scenery cues', () => {
  it('every SceneSfx maps to a world cue (quiet under a sheet)', () => {
    for (const k of Object.keys(KINDS) as SceneSfx[]) {
      const c = CUES[`scene-${k}`];
      expect(c, k).toBeDefined();
      expect(c.world, k).toBe(true);
    }
  });
  it('quiet (≤ 0.5 at the sound), jittered, at most two at once, never a jingle (the shooting star must not duck)', () => {
    for (const k of Object.keys(KINDS) as SceneSfx[]) {
      const c = CUES[`scene-${k}`];
      const d = SOUNDS[c.sound];
      expect(d.gain * (c.gain ?? 1), k).toBeLessThanOrEqual(0.5);
      expect(d.jitter, k).toBeGreaterThan(0);
      expect(d.max, k).toBeLessThanOrEqual(2);
      expect(d.jingle, k).toBeFalsy();
      expect(durationOf(c.sound), k).toBeLessThan(1); // a ≤ 1 s flourish
    }
  });
});
