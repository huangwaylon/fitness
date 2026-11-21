import { describe, expect, it } from 'vitest';
import { camToast, onPan, onRotate, tapLocate, type Cam } from './follow.ts';

const run = (taps: number, x = { hiking: false, compass: true }, from: Cam = 'off') => {
  const seen: Cam[] = [];
  let c = from;
  for (let i = 0; i < taps; i++) seen.push((c = tapLocate(c, x)));
  return seen;
};

describe('the location disc: off → 追従 → 進行方向 → off', () => {
  it('loops through the three, a toast for each', () => {
    expect(run(4)).toEqual(['follow', 'heading', 'off', 'follow']);
    expect(run(3).map(camToast)).toEqual(['camFollow', 'camHeading', 'camOff']);
  });

  it('no compass (refused): heading skipped', () => {
    expect(run(3, { hiking: false, compass: false })).toEqual(['follow', 'off', 'follow']);
  });

  it('hike mode never goes off (the position is needed): 追従 ⇄ 進行方向', () => {
    expect(run(4, { hiking: true, compass: true })).toEqual(['follow', 'heading', 'follow', 'heading']);
    expect(run(2, { hiking: true, compass: false })).toEqual(['follow', 'follow']);
  });

  it('a pan lets the camera go (hollow); a tap follows again', () => {
    expect(onPan('follow')).toBe('free');
    expect(onPan('heading')).toBe('free');
    expect(onPan('off')).toBe('off');
    expect(tapLocate('free', { hiking: false, compass: true })).toBe('follow');
    expect(camToast('free')).toBeNull();
  });

  it('a two-finger turn (or the compass disc) leaves heading mode for follow; nothing else changes', () => {
    expect(onRotate('heading')).toBe('follow');
    expect(onRotate('follow')).toBe('follow');
    expect(onRotate('off')).toBe('off');
    expect(onRotate('free')).toBe('free');
  });
});
