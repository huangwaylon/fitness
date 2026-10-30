// typeParts (T7): Japanese workout labels break only at their word joints, English at its spaces.
import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from '#lib/i18n/state.svelte.ts';
import { WORKOUT_TYPES } from '#lib/contract/labels.ts';
import { badgeGoals, kgDelta, kgText, parseKcalInput, parseKgInput, typeLabel, typeParts } from './fmt.ts';

afterEach(() => setLocale('ja'));

describe('typeParts', () => {
  it('splits Japanese labels at their word joints', () => {
    expect(typeParts('Traditional Strength Training')).toEqual({ parts: ['筋力', 'トレーニング'], spaced: false });
    expect(typeParts('High Intensity Interval Training').parts).toEqual(['高強度', 'インターバル', 'トレーニング']);
    expect(typeParts('Outdoor Walk').parts).toEqual(['屋外', 'ウォーキング']);
    expect(typeParts('Yoga').parts).toEqual(['ヨガ']);
  });
  it('keeps every label whole when joined back', () => {
    for (const ty of WORKOUT_TYPES) expect(typeParts(ty).parts.join('')).toBe(typeLabel(ty));
  });
  it('splits English at spaces', () => {
    setLocale('en');
    expect(typeParts('Outdoor Walk')).toEqual({ parts: ['Outdoor', 'Walk'], spaced: true });
  });
});

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

describe('Move goal input (ADR 0021)', () => {
  it('reads whole kcal in the pref bounds', () => {
    expect(parseKcalInput('600')).toBe(600);
    expect(parseKcalInput(' 1,200 kcal')).toBe(1200);
    expect(parseKcalInput('６００')).toBe(600);
    for (const s of ['', '99', '2001', '600.5', 'abc', '-400']) expect(parseKcalInput(s)).toBeNull();
  });
});

describe('badge thresholds', () => {
  it('are the latest rules: 5 · 5 · 5 · 4 · 3 days', () => {
    expect(badgeGoals('2026-10-26')).toEqual({ peach: 5, pear: 5, cherry: 5, apple: 4, coconut: 3 });
  });
});
