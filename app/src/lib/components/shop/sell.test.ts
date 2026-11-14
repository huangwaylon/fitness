// うる's picks (shop/sell.ts): a row's tap takes the stack, − / + stay inside it, a section's 全部 takes it all.
import { describe, expect, it } from 'vitest';
import { allPicked, sellAllOf, step, toggleSection, toggleStack } from './sell.ts';

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

describe('全部売る', () => {
  const price = (k: string) => ({ 'fish:koi': 200, 'goods:wood': 3, 'goods:tomato': 14, 'goods:tomato-start': 14 } as Record<string, number>)[k];
  it('sells every stack whole at its price', () => {
    const p = sellAllOf(new Map([['fish:koi', 2], ['goods:wood', 30]]), price);
    expect([...p.picks]).toEqual([['fish:koi', 2], ['goods:wood', 30]]);
    expect(p).toMatchObject({ n: 32, v: 2 * 200 + 30 * 3, kept: [] });
  });
  it('keeps the starts (held to plant) and one of the vegetable today’s おねがい asks for', () => {
    const p = sellAllOf(new Map([['goods:tomato-start', 5], ['goods:tomato', 3], ['fish:koi', 1]]), price, 'goods:tomato');
    expect([...p.picks]).toEqual([['goods:tomato', 2], ['fish:koi', 1]]);
    expect(p.kept).toEqual([{ k: 'goods:tomato-start', n: 5, why: 'start' }, { k: 'goods:tomato', n: 1, why: 'ask' }]);
    expect(p.v).toBe(2 * 14 + 200);
  });
  it('nothing to sell: only starts, the asked one alone, or an unpriced key', () => {
    const p = sellAllOf(new Map([['goods:tomato-start', 2], ['goods:tomato', 1], ['goods:nope', 4]]), price, 'goods:tomato');
    expect(p.picks.size).toBe(0);
    expect(p.n).toBe(0);
    expect(sellAllOf([], price)).toMatchObject({ n: 0, v: 0, kept: [] });
  });
});
