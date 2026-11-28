// The money readers (finance/money.ts, ported from the shared-expense app's money tests): what a person types read as
// whole yen, a share as a fraction and as basis points (exact or reported), yen shown and summed, and the contract's
// split (finSplit) over many random amounts and shares: never a yen lost or invented.
import { describe, expect, it } from 'vitest';
import { FIN_AMT_MAX, FIN_BP, finSplit } from '#lib/contract/finance.ts';
import { mulberry32 } from '#lib/random.ts';
import { formatYen, parseShare, parseShareBp, parseYen, shareToBp, sumYen } from './money.ts';

describe('parseYen: what a person actually types', () => {
  it('reads plain integers', () => {
    expect([parseYen('1250'), parseYen('0'), parseYen('1')]).toEqual([1250, 0, 1]);
  });

  it('rounds a typed decimal half up on its first digit', () => {
    expect(parseYen('1250.4')).toBe(1250);
    expect(parseYen('1250.5')).toBe(1251);
    expect(parseYen('1250.49')).toBe(1250);
    expect(parseYen('0.49')).toBe(0);
    expect(parseYen('0.5')).toBe(1);
  });

  it('reads a bank export’s six-decimal amounts, and a keyboard’s sloppy shapes', () => {
    expect(parseYen('1400.000000')).toBe(1400);
    expect(parseYen('.5')).toBe(1);
    expect(parseYen('.4')).toBe(0);
    expect(parseYen('1250.')).toBe(1250);
  });

  it('strips spaces and currency signs, the fullwidth yen too', () => {
    for (const s of [' ¥1250 ', '￥1250', '$1250', '1250 ¥', '1 250', '1 250']) expect(parseYen(s), s).toBe(1250);
  });

  it('reads a comma before one or two digits as decimal, before three as grouping', () => {
    expect(parseYen('42,10')).toBe(42);
    expect(parseYen('42,50')).toBe(43);
    expect(parseYen(',5')).toBe(1);
    expect(parseYen('1,234')).toBe(1234);
    expect(parseYen('1,234,567')).toBe(1234567);
  });

  it('takes the last separator as the decimal one when both kinds appear', () => {
    expect(parseYen('1,234.56')).toBe(1235);
    expect(parseYen('1.234,56')).toBe(1235);
    expect(parseYen('1.234,49')).toBe(1234);
  });

  it('answers null for malformed grouping, junk, negatives, exponents and too many digits', () => {
    for (const bad of ['12,34,567', '1,2345,678', ',,5', '', '   ', 'abc', '12a5', '.', null, undefined, {}, [], '-1250', '−1250', -1250, 1e21, 1e-7, NaN, Infinity, '99999999999999']) {
      expect(parseYen(bad), JSON.stringify(bad)).toBeNull();
    }
    expect(parseYen(1250.5)).toBe(1251);
    expect(parseYen('9999999999999')).toBe(9999999999999);
    expect(parseYen('0000000000000001')).toBe(1);
  });
});

describe('parseShare', () => {
  it('reads a fraction as a fraction, above 1 or with a % as a percentage', () => {
    expect([parseShare('0.5'), parseShare(0.8), parseShare('80'), parseShare('1'), parseShare('0'), parseShare('80%')]).toEqual([0.5, 0.8, 0.8, 1, 0, 0.8]);
    expect([parseShare('1%'), parseShare('0.5%'), parseShare('100%'), parseShare(2)]).toEqual([0.01, 0.005, 1, 0.02]);
  });

  it('clamps past 100 %, tolerates a cell’s spaces', () => {
    expect([parseShare('150'), parseShare('150%'), parseShare(' 0.5 '), parseShare(' 80 ')]).toEqual([1, 1, 0.5, 0.8]);
  });

  it('refuses what it can’t read whole, rather than reading part of it', () => {
    for (const bad of ['0,5', '0.5x', '0b1', '1e3', 'half', '', ' ', '-0.5', null, undefined, {}, NaN, -1]) expect(parseShare(bad), JSON.stringify(bad)).toBeNull();
  });
});

describe('basis points', () => {
  it('converts the common fractions exactly, and reports one that isn’t', () => {
    expect(shareToBp(0.8)).toEqual({ bp: 8000, exact: true });
    expect(shareToBp(0.5)).toEqual({ bp: 5000, exact: true });
    expect(shareToBp(0.75)).toEqual({ bp: 7500, exact: true });
    expect(shareToBp(1)).toEqual({ bp: FIN_BP, exact: true });
    expect(shareToBp(0)).toEqual({ bp: 0, exact: true });
    expect(shareToBp(0.333)).toEqual({ bp: 3330, exact: true });
    expect(shareToBp(1 / 3)).toEqual({ bp: 3333, exact: false });
    expect(shareToBp(2 / 3)).toEqual({ bp: 6667, exact: false });
    expect(shareToBp(0.00005)).toEqual({ bp: 1, exact: false });
    // every whole percent and every basis point is exact (the float noise of n / 100 rounds away)
    for (let p = 0; p <= 100; p++) expect(shareToBp(p / 100), String(p)).toEqual({ bp: p * 100, exact: true });
    for (let bp = 0; bp <= FIN_BP; bp++) expect(shareToBp(bp / FIN_BP).bp).toBe(bp);
  });

  it('refuses a fraction outside [0, 1]', () => {
    for (const bad of [-0.1, 1.1, NaN, Infinity]) expect(() => shareToBp(bad)).toThrow(TypeError);
  });

  it('reads a typed share as basis points', () => {
    expect([parseShareBp('80'), parseShareBp('0.8'), parseShareBp('100%'), parseShareBp('33.33%'), parseShareBp('x')]).toEqual([8000, 8000, FIN_BP, 3333, null]);
  });
});

describe('the split never loses or invents a yen', () => {
  it('adds back to the amount and lands within half a yen of the exact share, over many random amounts and shares', () => {
    const r = mulberry32(20261128);
    for (let i = 0; i < 20000; i++) {
      const amt = i % 4 === 0 ? 1 + Math.floor(r() * 1000) : 1 + Math.floor(r() * FIN_AMT_MAX);
      const ps = i % 5 === 0 ? [0, 2500, 3333, 5000, 6667, 7500, 8000, FIN_BP][i % 8] : Math.floor(r() * (FIN_BP + 1));
      const { payerYen, otherYen } = finSplit(amt, ps);
      expect(Number.isInteger(payerYen) && Number.isInteger(otherYen)).toBe(true);
      expect(payerYen + otherYen).toBe(amt);
      expect(payerYen >= 0 && otherYen >= 0).toBe(true);
      // exactly: |payerYen·FIN_BP − amt·ps| ≤ FIN_BP / 2, a half up on the tie
      const diff = payerYen * FIN_BP - amt * ps;
      expect(diff > -FIN_BP / 2 && diff <= FIN_BP / 2, `${amt} ${ps}`).toBe(true);
    }
  });

  it('is the old app’s arithmetic exactly (Math.round(amt × fraction)), so a row moved over keeps its yen', () => {
    // 45 × 0.7 is 31.499… in floats: the old app gave the payer 31, and so does finSplit (exact half-up would give 32
    // and move the balance by a yen on import)
    expect(finSplit(45, 7000).payerYen).toBe(31);
    // every whole-percent share and every amount the old app's rows reach agree with Math.round(amt × fraction)
    for (let pct = 0; pct <= 100; pct++) {
      const fraction = pct === 100 ? 1 : Number(`0.${String(pct).padStart(2, '0')}`);
      for (let amt = 1; amt <= 20000; amt++) if (finSplit(amt, pct * 100).payerYen !== Math.round(amt * fraction)) throw new Error(`${amt} ${pct}%`);
    }
  });
});

describe('formatYen', () => {
  it('groups, never shows a fraction, follows the locale asked for', () => {
    expect(formatYen(1250, 'en')).toContain('1,250');
    expect(formatYen(1250, 'en')).not.toMatch(/[.,]\d{2}$/);
    expect(formatYen(1250)).toContain('1,250');
    expect(formatYen(1234567, 'de-DE')).toContain('1.234.567');
    expect(formatYen(-1250, 'en')).toMatch(/-|\(/);
  });

  it('throws on anything but whole yen', () => {
    for (const bad of [NaN, 1.5, '1250', undefined]) expect(() => formatYen(bad as number)).toThrow(TypeError);
  });
});

describe('sumYen', () => {
  it('sums integers, 0 for none, and throws rather than answer NaN', () => {
    expect([sumYen([]), sumYen([1, 2, 3]), sumYen([4210, -4210])]).toEqual([0, 6, 0]);
    for (const bad of [[1, '2'], [1, NaN], [1, undefined], [1, 2.5]]) expect(() => sumYen(bad as number[])).toThrow(TypeError);
    expect(() => sumYen([Number.MAX_SAFE_INTEGER, 1])).toThrow(RangeError);
  });
});
