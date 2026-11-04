import { describe, expect, it } from 'vitest';
import { ROOT, aim, type Lift } from './exactTaps.ts';

// Stand-ins for elements: `closest(ROOT)` answers whether one is inside a data-exact-taps place.
const el = (inRoot: boolean) => ({ closest: (s: string) => (s === ROOT && inRoot ? {} : null) }) as unknown as Element;
const stage = el(true), door = el(true), hud = el(false), other = el(false);
const lift = (o: Partial<Lift> = {}): Lift => ({ x: 196, y: 158, t: 1000, moved: false, ...o });

describe('a tap’s click where the finger was (exactTaps aim)', () => {
  it('a touch on the sea moved onto a door a few px off goes back to the sea, at the finger’s point', () => {
    expect(aim({ target: door, x: 200, y: 162, t: 1010 }, lift(), stage)).toBe('move');
  });
  it('a click as tapped stays native (a door tapped on itself, the sea on itself)', () => {
    expect(aim({ target: door, x: 196, y: 158, t: 1010 }, lift(), door)).toBe('keep');
    expect(aim({ target: stage, x: 196.4, y: 158.6, t: 1010 }, lift(), stage)).toBe('keep');
  });
  it('the same element but its point moved: moved back', () => {
    expect(aim({ target: stage, x: 203, y: 158, t: 1010 }, lift(), stage)).toBe('move');
  });
  it('a touch on a HUD pill moved onto the island goes to the pill; one moved off the island onto the HUD back too', () => {
    expect(aim({ target: door, x: 200, y: 162, t: 1010 }, lift(), hud)).toBe('move');
    expect(aim({ target: hud, x: 200, y: 162, t: 1010 }, lift(), stage)).toBe('move');
  });
  it('outside the island and the rooms, WebKit’s own (a HUD button’s fat-finger help stays)', () => {
    expect(aim({ target: hud, x: 200, y: 162, t: 1010 }, lift(), other)).toBe('keep');
  });
  it('no tap just before it (a keyboard’s, VoiceOver’s), a drag’s, or a stale lift: as it came', () => {
    expect(aim({ target: door, x: 200, y: 162, t: 1010 }, null, stage)).toBe('keep');
    expect(aim({ target: door, x: 200, y: 162, t: 1010 }, lift({ moved: true }), stage)).toBe('keep');
    expect(aim({ target: door, x: 200, y: 162, t: 2500 }, lift(), stage)).toBe('keep');
  });
});
