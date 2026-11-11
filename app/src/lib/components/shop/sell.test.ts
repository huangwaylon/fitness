// うる's picks (shop/sell.ts): a row's tap takes the stack, − / + stay inside it, a section's 全部 takes it all.
import { describe, expect, it } from 'vitest';
import { allPicked, step, toggleSection, toggleStack } from './sell.ts';

const wood = { k: 'goods:wood', n: 30 }, koi = { k: 'fish:koi', n: 2 }, bass = { k: 'fish:sea-bass', n: 5 };

describe('うる’s picks', () => {
  it('a row’s tap takes the whole stack (30 wood in one tap); again, none; from a part, the whole', () => {
    const one = toggleStack({}, wood);
    expect(one).toEqual({ 'goods:wood': 30 });
    expect(toggleStack(one, wood)).toEqual({ 'goods:wood': 0 });
    expect(toggleStack({ 'goods:wood': 3 }, wood)).toEqual({ 'goods:wood': 30 });
  });
  it('− / + one at a time, held at 0 and at the stack (never wrapping to 0)', () => {
    expect(step({}, koi, 1)).toEqual({ 'fish:koi': 1 });
    expect(step({ 'fish:koi': 2 }, koi, 1)).toEqual({ 'fish:koi': 2 });
    expect(step({}, koi, -1)).toEqual({ 'fish:koi': 0 });
    expect(step({ 'fish:koi': 2, 'goods:wood': 4 }, koi, -1)).toEqual({ 'fish:koi': 1, 'goods:wood': 4 });
  });
  it('a section’s 全部: every stack in it whole, leaving the others; again, none of them', () => {
    const fish = [koi, bass];
    const on = toggleSection({ 'goods:wood': 7, 'fish:koi': 1 }, fish);
    expect(on).toEqual({ 'goods:wood': 7, 'fish:koi': 2, 'fish:sea-bass': 5 });
    expect(allPicked(on, fish)).toBe(true);
    expect(toggleSection(on, fish)).toEqual({ 'goods:wood': 7, 'fish:koi': 0, 'fish:sea-bass': 0 });
    expect(allPicked({}, [])).toBe(false);
  });
});
