import { describe, expect, it } from 'vitest';
import { bandOf, camFailOf } from './camera.ts';

describe('bandOf: the part of a frame read', () => {
  it("a portrait frame in the 4:3 box: its full width, half of what the box shows of its height, at most 800 wide", () => {
    // 720 × 1280: the box shows 720 × 540 of it; half that, 270, around the middle
    expect(bandOf(720, 1280)).toEqual({ sx: 0, sy: 505, sw: 720, sh: 270, dw: 720, dh: 270 });
  });
  it('a landscape frame wider than the box: its middle 4:3, scaled down to 800 wide', () => {
    expect(bandOf(1920, 1080)).toEqual({ sx: 240, sy: 270, sw: 1440, sh: 540, dw: 800, dh: 300 });
  });
});

describe('camFailOf', () => {
  it("reads getUserMedia's errors as the sheet's three cases", () => {
    expect(camFailOf(new DOMException('', 'NotAllowedError'))).toBe('denied');
    expect(camFailOf(new DOMException('', 'SecurityError'))).toBe('denied');
    expect(camFailOf(new DOMException('', 'NotFoundError'))).toBe('nocam');
    expect(camFailOf(new DOMException('', 'OverconstrainedError'))).toBe('nocam');
    expect(camFailOf(new DOMException('', 'NotReadableError'))).toBe('other');
    expect(camFailOf('x')).toBe('other');
  });
});
