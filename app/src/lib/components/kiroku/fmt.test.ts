// typeParts (T7): Japanese workout labels break only at their word joints, English at its spaces.
import { afterEach, describe, expect, it } from 'vitest';
import { setLocale } from '#lib/i18n/state.svelte.ts';
import { WORKOUT_TYPES } from '#lib/contract/labels.ts';
import { typeLabel, typeParts } from './fmt.ts';

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
