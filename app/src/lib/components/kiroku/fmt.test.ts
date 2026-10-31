// The きろく formatters: weights and the two goal fields.
import { describe, expect, it } from 'vitest';
import { kgDelta, kgText, parseKcalInput, parseKgInput } from './fmt.ts';

describe('weight text', () => {
  it('formats weights and changes with a true minus', () => {
    expect(kgText(68.4)).toBe('68.4 kg');
    expect(kgDelta(-0.34)).toBe('−0.3 kg');
    expect(kgDelta(0.2)).toBe('+0.2 kg');
    expect(kgDelta(0.04)).toBe('±0.0 kg');
    expect(kgDelta(null)).toBe('–');
  });
  it('reads a typed weight', () => {
    expect(parseKgInput('68.4')).toBe(68.4);
    expect(parseKgInput(' 68,4 ')).toBe(68.4);
    expect(parseKgInput('６８．４')).toBe(68.4);
    expect(parseKgInput('68.45kg')).toBe(68.5);
    expect(parseKgInput('72')).toBe(72);
    for (const s of ['', '19', '301', 'abc', '68..4', '-70', '1e2']) expect(parseKgInput(s)).toBeNull();
  });
});

describe('Move goal input', () => {
  it('reads whole kcal in the pref bounds', () => {
    expect(parseKcalInput('600')).toBe(600);
    expect(parseKcalInput(' 1,200 kcal')).toBe(1200);
    expect(parseKcalInput('６００')).toBe(600);
    for (const s of ['', '99', '2001', '600.5', 'abc', '-400']) expect(parseKcalInput(s)).toBeNull();
  });
});

