import { describe, expect, it } from 'vitest';
import { fullScreenHeight } from './viewport.ts';

describe('fullScreenHeight (iOS standalone cold launch)', () => {
  it('the screen height when standalone and the window spans a full screen side', () => {
    expect(fullScreenHeight(393, true, 393, 852)).toBe(852); // portrait iPhone 15
    expect(fullScreenHeight(852, true, 393, 852)).toBe(393); // landscape (screen doesn't swap)
  });
  it('nothing in Safari tabs, Split View or Stage Manager', () => {
    expect(fullScreenHeight(393, false, 393, 852)).toBeNull();
    expect(fullScreenHeight(320, true, 393, 852)).toBeNull();
  });
});
