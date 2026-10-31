// The mix rules (docs/design.md#mix): the voice limit, pitch jitter, the duck under a jingle, and the cue table.
import { describe, expect, it } from 'vitest';
import { MAX_VOICES, VoiceLimiter, duckPlan, jitterRate, semitones } from './mix.ts';
import { SOUNDS, SOUND_IDS, isSoundId } from './ids.ts';
import { CUES, coinStep } from './cues.ts';
import { REACTIONS } from '../components/motion/reactions.ts';

describe('voice limit', () => {
  it('stops the oldest of an id over its own cap (coin: 3)', () => {
    const v = new VoiceLimiter();
    const keys = [0, 1, 2].map((i) => (v.admit('coin', i * 0.01, 1) as { key: number }).key);
    const r = v.admit('coin', 0.05, 1);
    expect(r).toEqual({ ok: true, key: 4, stop: [keys[0]] });
    expect(v.active(0.05).filter((x) => x.id === 'coin')).toHaveLength(3);
  });

  it(`never lets more than ${MAX_VOICES} sound at once: the oldest non-jingle goes`, () => {
    const v = new VoiceLimiter();
    const ids = ['pop', 'rustle', 'thud', 'heart', 'sparkle', 'cursor'] as const;
    ids.forEach((id, i) => v.admit(id, i * 0.01, 2));
    const r = v.admit('surprise', 0.1, 2);
    expect(r.ok && r.stop).toEqual([1]);
    expect(v.active(0.1)).toHaveLength(MAX_VOICES);
  });

  it('drops a jingle while another jingle plays, and frees it when it ends', () => {
    const v = new VoiceLimiter();
    expect(v.admit('fanfare', 0, 1.4).ok).toBe(true);
    expect(v.admit('miles', 0.5, 0.8).ok).toBe(false);
    expect(v.jingleUntil(0.5)).toBeCloseTo(1.4);
    expect(v.admit('miles', 1.5, 0.8).ok).toBe(true);
  });

  it('a jingle is never stolen for an effect; a full house of jingles refuses the newcomer', () => {
    const v = new VoiceLimiter(2);
    v.admit('fanfare', 0, 2);
    v.admit('pop', 0, 2);
    expect(v.admit('coin', 0.1, 1)).toEqual({ ok: true, key: 3, stop: [2] });
  });

  it('expired voices free their slot; release frees early', () => {
    const v = new VoiceLimiter(1);
    const a = v.admit('pop', 0, 0.1);
    expect(v.admit('thud', 0.2, 0.1)).toEqual({ ok: true, key: 2, stop: [] });
    if (a.ok) v.release(a.key);
    const b = v.admit('rustle', 0.25, 0.5);
    expect(b.ok && b.stop).toEqual([2]);
  });
});

describe('pitch', () => {
  it('jitters within ± the cents asked (and not at all for 0)', () => {
    expect(jitterRate(0, () => 0.9)).toBe(1);
    expect(jitterRate(100, () => 1)).toBeCloseTo(semitones(1));
    expect(jitterRate(100, () => 0)).toBeCloseTo(semitones(-1));
    for (let i = 0; i < 50; i++) {
      const r = jitterRate(60);
      expect(r).toBeGreaterThanOrEqual(2 ** (-60 / 1200));
      expect(r).toBeLessThanOrEqual(2 ** (60 / 1200));
    }
  });
  it('12 semitones is an octave', () => {
    expect(semitones(12)).toBeCloseTo(2);
  });
});

describe('duck under a jingle', () => {
  it('dips to the depth after the attack, holds, and comes back after the release', () => {
    const p = duckPlan(10, 11.4, { depth: 0.25, attack: 0.1, release: 0.8 });
    expect(p.map((x) => x.gain)).toEqual([1, 0.25, 0.25, 1]);
    [10, 10.1, 11.4, 12.2].forEach((t, i) => expect(p[i].t).toBeCloseTo(t));
  });
  it('a jingle shorter than the attack still returns in order', () => {
    const p = duckPlan(0, 0.05);
    expect(p.map((x) => x.t)).toEqual([...p.map((x) => x.t)].sort((a, b) => a - b));
  });
});

describe('the catalogue and the cue table', () => {
  it('every cue names a real sound, and every sound is used by a cue or the voice', () => {
    for (const c of Object.values(CUES)) expect(isSoundId(c.sound)).toBe(true);
    const used = new Set<string>([...Object.values(CUES).map((c) => c.sound), 'blip-host', 'blip-villager']);
    expect(SOUND_IDS.filter((id) => !used.has(id))).toEqual([]);
  });
  it('levels stay gentle: nothing above 0.8, UI ticks under the island actions, jingles on the sfx bus', () => {
    for (const id of SOUND_IDS) expect(SOUNDS[id].gain).toBeLessThanOrEqual(0.8);
    expect(SOUNDS.cursor.gain).toBeLessThan(SOUNDS.rustle.gain);
    for (const id of SOUND_IDS.filter((i) => SOUNDS[i].jingle)) expect(SOUNDS[id].bus).toBe('sfx');
  });
  it('only events and taps sound: the startup beats, naps and the dance are silent', () => {
    for (const rid of ['R2', 'R11', 'R12', 'R13', 'R15', 'R16', 'R19'] as const) expect(REACTIONS[rid].steps.some((s) => s.cue)).toBe(false);
    for (const rid of ['R9', 'R10', 'R17'] as const) expect(REACTIONS[rid].steps.some((s) => s.cue)).toBe(true);
  });
  it('island sounds wait while the scene is covered; UI sounds never do', () => {
    for (const c of ['tree-shake', 'fruit-land', 'coin-land', 'bells-arrive', 'emote-joy', 'announce'] as const) expect(CUES[c].world).toBe(true);
    for (const c of ['phone-open', 'choice-pick', 'buy', 'badge-met', 'harvest-receive', 'back'] as const) expect(CUES[c].world).toBeUndefined();
  });
  it('a coin run climbs one pentatonic step per coin across the batch, then holds the top', () => {
    expect([0, 1, 2, 3, 4].map(coinStep)).toEqual([0, 2, 4, 7, 9]);
    expect(coinStep(23)).toBe(19);
    expect(coinStep(-1)).toBe(0);
  });
});
