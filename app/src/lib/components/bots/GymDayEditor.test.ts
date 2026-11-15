// ジム's day editor (GymDayEditor): the reset button's words, by what the day has saved.
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import GymDayEditor from './GymDayEditor.svelte';
import type { DayRow } from '#lib/gym/contract.ts';

const sat = (patch: Partial<DayRow>): DayRow =>
  ({ day: '2026-11-14', rule: 'skip', usual: false, weekend: true, from: null, announced: [], resettable: false, base: 'b', ...patch });
const reset = (row: DayRow) => {
  const { body } = render(GymDayEditor, { props: { open: true, row, usualDay: false, now: Date.parse('2026-11-12T12:00:00+09:00'), onact: () => {}, note: null } });
  return body.match(/data-gym-reset[^>]*>([^<]*)</)?.[1] ?? null;
};

describe('GymDayEditor', () => {
  it('a weekend: nothing saved, no reset; saved (オフ from before, or 終日) ふだんに戻す; an announced time alone リセット', () => {
    expect(reset(sat({}))).toBeNull();
    expect(reset(sat({ resettable: true }))).toBe('ふだんに戻す');
    expect(reset(sat({ rule: 'any', resettable: true }))).toBe('ふだんに戻す');
    expect(reset(sat({ resettable: true, announced: ['12:00'] }))).toBe('リセット');
  });
});
