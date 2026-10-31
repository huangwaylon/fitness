// The hourly music and the ambience, pure (docs/design.md#hourly-music, #ambience): track choice by Tokyo hour and weather, the next hour,
// the crossfade schedule, the ambient layers.
import { describe, expect, it } from 'vitest';
import { CROSSFADE, FADE_IN, crossfadePlan, hourKey, msToNextHour, trackAt, trackFor, type MusicFiles } from './hourly.ts';
import { ambientFor } from './ambient.ts';

const FILES: MusicFiles = {
  sunny: { '00': { file: 'music/hour-00.m4a', start: 1 }, '07': { file: 'music/hour-07.m4a', start: 66.19 }, '23': { file: 'music/hour-23.m4a', start: 0 } },
  rain: { '07': { file: 'music/rain-07.m4a', start: 2 } }
};

describe('track by hour', () => {
  it('names hours with two digits', () => {
    expect([0, 7, 23].map(hourKey)).toEqual(['00', '07', '23']);
  });
  it('picks the hour’s track, with its loop start', () => {
    expect(trackFor(7, 'sunny', FILES)).toEqual({ key: 'sunny/07', file: 'music/hour-07.m4a', start: 66.19 });
  });
  it('plays the weather arrangement when there is one, else the sunny one of the same hour', () => {
    expect(trackFor(7, 'rain', FILES)?.key).toBe('rain/07');
    expect(trackFor(0, 'rain', FILES)?.key).toBe('sunny/00');
    expect(trackFor(23, 'snow', FILES)?.key).toBe('sunny/23');
  });
  it('a missing hour is silence, never another hour', () => {
    expect(trackFor(12, 'sunny', FILES)).toBeNull();
    expect(trackFor(5, 'sunny', {})).toBeNull();
  });
  it('uses the Tokyo hour, whatever the phone’s zone', () => {
    // 22:30 UTC = 07:30 in Tokyo
    expect(trackAt(new Date('2026-10-29T22:30:00Z'), 'sunny', FILES)?.key).toBe('sunny/07');
    // 15:00 UTC = midnight in Tokyo
    expect(trackAt(new Date('2026-10-30T15:00:00Z'), 'sunny', FILES)?.key).toBe('sunny/00');
  });
});

describe('the top of the hour', () => {
  it('counts down to the next full hour', () => {
    expect(msToNextHour(new Date('2026-10-30T06:59:30Z'))).toBe(30_000);
    expect(msToNextHour(new Date('2026-10-30T07:00:00Z'))).toBe(3_600_000);
    expect(msToNextHour(new Date('2026-10-30T07:15:00.250Z'))).toBe(45 * 60_000 - 250);
  });
});

describe('crossfade schedule', () => {
  it('the old track fades out over 3 s while the new one enters a second in', () => {
    const p = crossfadePlan(100, true);
    expect(p).toEqual({ outFrom: 100, outTo: 100 + CROSSFADE.out, inFrom: 100 + CROSSFADE.inAt, inTo: 100 + CROSSFADE.inAt + CROSSFADE.inFor });
    expect(p.inFrom).toBeGreaterThan(p.outFrom);
    expect(p.inTo).toBeLessThanOrEqual(p.outTo);
    expect(p.outTo - p.outFrom).toBe(3);
  });
  it('nothing playing (a first start, a return to the app): only a short fade in', () => {
    expect(crossfadePlan(5, false)).toEqual({ outFrom: 5, outTo: 5, inFrom: 5, inTo: 5 + FADE_IN });
  });
  it('a cut-in (the wasps, K.K.) swaps at once: out in a quarter second as the new one comes up', () => {
    expect(crossfadePlan(10, true, true)).toEqual({ outFrom: 10, outTo: 10.25, inFrom: 10, inTo: 10.25 });
    expect(crossfadePlan(10, false, true)).toEqual({ outFrom: 10, outTo: 10, inFrom: 10, inTo: 10.25 });
  });
});

describe('ambience', () => {
  const ids = (h: number, m: number, w: 'sunny' | 'rain' | 'snow' = 'sunny') => ambientFor(h, m, w).map((l) => l.id);
  it('the surf never stops', () => {
    for (const h of [0, 6, 12, 18, 23]) expect(ids(h, 5)).toContain('waves');
  });
  it('cicadas on summer days, the evening cicada at dawn and dusk, crickets on autumn nights', () => {
    expect(ids(13, 8)).toContain('cicadas');
    expect(ids(13, 6)).not.toContain('cicadas');
    expect(ids(17, 7)).toContain('higurashi');
    expect(ids(13, 7)).not.toContain('higurashi');
    expect(ids(21, 10)).toContain('crickets');
    expect(ids(3, 10)).toContain('crickets');
    expect(ids(12, 10)).not.toContain('crickets');
  });
  it('birds on fine days only; rain and winter wind', () => {
    expect(ids(7, 4)).toContain('birds');
    expect(ids(7, 4, 'rain')).not.toContain('birds');
    expect(ids(7, 4, 'rain')).toContain('rain');
    expect(ids(12, 1)).toContain('wind');
    expect(ids(12, 1, 'snow')).not.toContain('crickets');
  });
  it('the season of the birds: the bush warbler in spring, a few birds in winter, quieter; none at night', () => {
    const birds = (h: number, m: number) => ambientFor(h, m, 'sunny').find((l) => l.id === 'birds');
    expect(birds(7, 4)?.v).toBe('spring');
    expect(birds(7, 7)?.v).toBe('summer');
    expect(birds(7, 10)?.v).toBe('autumn');
    expect(birds(7, 1)?.v).toBe('winter');
    expect(birds(7, 1)!.gain).toBeLessThan(birds(7, 4)!.gain);
    expect(birds(16, 1)).toBeUndefined();
    expect(birds(21, 5)).toBeUndefined();
  });
  it('a downpour: the rain louder, the surf under it; no insects in the rain', () => {
    const gain = (id: string, heavy: boolean) => ambientFor(12, 6, 'rain', { heavy }).find((l) => l.id === id)!.gain;
    expect(gain('rain', true)).toBeGreaterThan(gain('rain', false));
    expect(gain('waves', true)).toBeLessThan(gain('waves', false));
    expect(ids(21, 10, 'rain')).not.toContain('crickets');
    expect(ids(13, 8, 'rain')).not.toContain('cicadas');
    expect(ids(13, 1, 'snow')).toEqual(['waves', 'wind']);
  });
  it('every layer stays soft', () => {
    for (const l of ambientFor(6, 8, 'sunny')) expect(l.gain).toBeLessThanOrEqual(0.55);
  });
});
