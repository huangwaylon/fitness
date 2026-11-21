import { describe, expect, it } from 'vitest';
import { camToast, onPan, tapLocate, type Cam } from './follow.ts';

const run = (taps: number, x = { hiking: false }, from: Cam = 'off') => {
  const seen: Cam[] = [];
  let c = from;
  for (let i = 0; i < taps; i++) seen.push((c = tapLocate(c, x)));
  return seen;
};

describe('the location disc: off → 追従 → off', () => {
  it('loops through the two, a toast for each', () => {
    expect(run(3)).toEqual(['follow', 'off', 'follow']);
    expect(run(2).map(camToast)).toEqual(['camFollow', 'camOff']);
  });

  it('hike mode never goes off (the position is needed): a tap while following re-centres, 追従 again', () => {
    expect(run(3, { hiking: true })).toEqual(['follow', 'follow', 'follow']);
    expect(run(1, { hiking: true }).map(camToast)).toEqual(['camFollow']);
  });

  it('a pan lets the camera go (hollow); a tap follows again, in or out of a hike', () => {
    expect(onPan('follow')).toBe('free');
    expect(onPan('off')).toBe('off');
    expect(onPan('free')).toBe('free');
    expect(tapLocate('free', { hiking: false })).toBe('follow');
    expect(tapLocate('free', { hiking: true })).toBe('follow');
    expect(camToast('free')).toBeNull();
  });
});
