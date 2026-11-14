// The cue table (docs/design.md#cues): scenery taps are wired, quiet world sounds.
import { describe, expect, it, vi } from 'vitest';
import { CUES, cue, hearFrom } from './cues.ts';
import { play } from './sound.svelte.ts';

vi.mock('./sound.svelte.ts', () => ({ play: vi.fn(), covered: () => false, announce: vi.fn() }));
import { SOUNDS, type SceneSfx, type SoundId, type SynthId } from './ids.ts';
import { durationOf } from './synth.ts';

/** Whose placeholder an id uses: its own, or its `like`'s (followed to the end). */
const placeholderOf = (id: SoundId): SynthId => {
  let i = id;
  for (let n = 0; SOUNDS[i].like && n < 8; n++) i = SOUNDS[i].like!;
  return i as SynthId;
};

// every kind sceneSfx() can ask for (the Record type makes the compiler list them all)
const KINDS: Record<SceneSfx, true> = {
  bush: true, flower: true, cloud: true, sun: true, moon: true, star: true, 'shooting-star': true,
  splash: true, fish: true, sand: true, grass: true, snow: true, balloon: true, butterfly: true,
  present: true, cast: true, plop: true, nibble: true, bite: true, reel: true, catch: true, flee: true, net: true, 'bug-flee': true,
  shell: true, fragment: true, bottle: true, dig: true, wish: true, weed: true, water: true, clonk: true, glint: true,
  nest: true, buzz: true, sting: true, twig: true, mushroom: true,
  visitor: true, launch: true, firework: true, campfire: true, bench: true, kon: true, bar: true, pump: true, decor: true,
  harvest: true
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

describe('another player’s sounds by where they are (docs/sound-sync.md)', () => {
  it('a placed cue takes the camera’s gain: none off screen, softer away; mine (no `at`) as ever', () => {
    const gains: [string, number][] = (globalThis.__cueGains = []);
    const off = hearFrom((x) => (x > 500 ? 0 : x > 100 ? 0.5 : 1));
    vi.mocked(play).mockClear();
    cue('scene-twig', { at: [900, 0] });
    expect(play).not.toHaveBeenCalled();
    cue('scene-twig', { at: [200, 0] });
    expect(vi.mocked(play).mock.calls[0][1]?.gain).toBeCloseTo((CUES['scene-twig'].gain ?? 1) * 0.5);
    cue('scene-twig');
    expect(vi.mocked(play).mock.calls[1][1]?.gain).toBeCloseTo(CUES['scene-twig'].gain ?? 1);
    expect(gains).toEqual([['scene-twig', 0], ['scene-twig', 0.5]]);
    off();
    cue('scene-twig', { at: [900, 0] }); // nobody listening (no island): as it is
    expect(play).toHaveBeenCalledTimes(3);
    globalThis.__cueGains = undefined;
  });
});

describe('the harvest (docs/farming.md "Playing")', () => {
  it("a world harvest's pop is the island's, a fourth up", () => {
    expect(CUES['scene-harvest']).toEqual({ sound: 'pop', gain: 0.9, step: 5, world: true });
  });
  it("a call's step climbs on the cue's own: tap k plays k semitones above the first", () => {
    vi.mocked(play).mockClear();
    cue('scene-harvest');
    cue('scene-harvest', { step: 3 });
    const [a, b] = vi.mocked(play).mock.calls.map((c) => c[1]?.rate ?? 1);
    expect(a).toBeCloseTo(2 ** (5 / 12));
    expect(b).toBeCloseTo(2 ** (8 / 12));
  });
});
