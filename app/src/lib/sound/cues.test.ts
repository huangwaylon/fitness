// The cue table (docs/design.md#cues): scenery taps are wired, quiet world sounds.
import { describe, expect, it } from 'vitest';
import { CUES } from './cues.ts';
import { SOUNDS, placeholderOf, type SceneSfx } from './ids.ts';
import { durationOf } from './synth.ts';

// every kind sceneSfx() can ask for (the Record type makes the compiler list them all)
const KINDS: Record<SceneSfx, true> = {
  bush: true, flower: true, cloud: true, sun: true, moon: true, star: true, 'shooting-star': true,
  splash: true, fish: true, sand: true, grass: true, snow: true, balloon: true, butterfly: true,
  present: true, cast: true, plop: true, nibble: true, bite: true, reel: true, catch: true, flee: true, net: true, 'bug-flee': true,
  shell: true, fragment: true, bottle: true, dig: true, wish: true, weed: true, water: true, clonk: true, glint: true,
  nest: true, buzz: true, sting: true, twig: true, mushroom: true,
  visitor: true, launch: true, firework: true, campfire: true, bench: true, kon: true, bar: true, pump: true, decor: true
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
      expect(durationOf(placeholderOf(c.sound)), k).toBeLessThan(1); // a ≤ 1 s flourish
    }
  });
  it("fishing: the bite has its own sound (not the nibble's plop), the loudest of the scenery, so it's heard at once", () => {
    const bite = CUES['scene-bite'], nibble = CUES['scene-nibble'];
    expect(bite.sound).toBe('bite');
    expect(nibble.sound).not.toBe(bite.sound);
    expect(bite.delay ?? 0).toBe(0); // at the moment the bobber goes under
    const level = (k: SceneSfx) => SOUNDS[CUES[`scene-${k}`].sound].gain * (CUES[`scene-${k}`].gain ?? 1);
    for (const k of Object.keys(KINDS) as SceneSfx[]) expect(level('bite'), k).toBeGreaterThanOrEqual(level(k));
    expect(level('bite')).toBeGreaterThan(level('nibble') * 2);
  });
});

describe("NH's fanfares and the announcement (docs/design.md#cues)", () => {
  it('受け取る and a present: the get fanfare; both of us meeting all four goals: the complete fanfare, on the island', () => {
    expect(CUES['harvest-receive']).toEqual({ sound: 'get-fanfare' });
    expect(CUES['goals-complete']).toEqual({ sound: 'complete-fanfare', world: true });
    for (const c of ['harvest-receive', 'goals-complete'] as const) expect(SOUNDS[CUES[c].sound].jingle).toBe(true);
    // without their files: the item-get placeholder
    expect(placeholderOf('get-fanfare')).toBe('fanfare');
  });
  it("the day's first open: the chime, which plays the moment's radio jingle (sound.svelte.ts play, radio.ts)", () => {
    expect(CUES.announce).toEqual({ sound: 'chime', world: true });
  });
});
