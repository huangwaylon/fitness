import { describe, expect, it } from 'vitest';
import { aimOf, followOf } from './balloonFollow.ts';

const box = { left: 100, top: 200, right: 160, bottom: 300 };

describe('a balloon through a camera move (balloonFollow)', () => {
  it('aims where the tail does: the head from above, the feet from below, the facing edge’s upper part beside', () => {
    expect(aimOf(box, 'top')).toEqual([130, 200]);
    expect(aimOf(box, 'bottom')).toEqual([130, 300]);
    expect(aimOf(box, 'left')).toEqual([100, 224]);
    expect(aimOf(box, 'right')).toEqual([160, 224]);
  });

  it('a speaker (a box from the camera) is asked again each frame; gone, nothing', () => {
    const rect = (x: number, y: number) => ({ left: x, top: y, right: x + 60, bottom: y + 100 }) as DOMRect;
    let r = rect(100, 200);
    const speaker = { isConnected: true, getBoundingClientRect: () => r };
    const f = followOf(speaker, r, 'top');
    expect(f.aim).toEqual([130, 200]);
    r = rect(150, 180);
    expect(f.now()).toEqual([180, 180]);
    speaker.isConnected = false;
    expect(f.now()).toBeNull();
  });
});
