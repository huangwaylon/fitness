import { describe, expect, it } from 'vitest';
import { TRAILS } from './trails.ts';
import { minutesOf, sections, statusOf } from './list.ts';
import type { Trail } from './types.ts';

const base = TRAILS[0];
const t = (slug: string, o: Partial<Trail> = {}): Trail => ({ ...base, slug, ...o });
const plan = (dateISO: string) => ({ ...TRAILS.find((x) => x.plan)!.plan!, dateISO });
const walked = (dateISO: string) => ({ dateISO, downM: 1, standard: '1:00', constant: 1 });
const none = { region: null, diffs: new Set<never>() };
const slugs = (xs: { trails: Trail[] }[]) => xs.map((s) => s.trails.map((x) => x.slug));

describe('statusOf', () => {
  it('a plan today or later is 予定, a plan gone or a walk 歩いた, the rest 行きたい', () => {
    expect(statusOf(t('a', { plan: plan('2026-11-21') }), '2026-11-21')).toBe('planned');
    expect(statusOf(t('a', { plan: plan('2026-11-20') }), '2026-11-21')).toBe('walked');
    expect(statusOf(t('a', { walked: walked('2026-08-09') }), '2026-11-21')).toBe('walked');
    expect(statusOf(t('a'), '2026-11-21')).toBe('want');
  });
});

describe('minutesOf', () => {
  it('reads the guide time forms, a range by its low end', () => {
    expect(minutesOf('3 h 17 min')).toBe(197);
    expect(minutesOf('~3 h 30 min')).toBe(210);
    expect(minutesOf('10 – 13 h')).toBe(600);
    expect(minutesOf('45 min')).toBe(45);
  });
});

describe('sections', () => {
  const xs = [
    t('w1', { lengthKm: 9 }),
    t('p-late', { plan: plan('2026-12-05') }),
    t('d-old', { walked: walked('2026-08-09'), lengthKm: 3 }),
    t('w2', { lengthKm: 4, tiles: 'jp', diff: 'veryhard' }),
    t('p-soon', { plan: plan('2026-11-21') }),
    t('d-new', { walked: walked('2026-11-07'), lengthKm: 8 })
  ];
  it('おすすめ: 予定 soonest first, 行きたい as listed, 歩いた newest first', () => {
    const s = sections(xs, none, 'auto', '2026-11-20');
    expect(s.map((x) => x.status)).toEqual(['planned', 'want', 'walked']);
    expect(slugs(s)).toEqual([['p-soon', 'p-late'], ['w1', 'w2'], ['d-new', 'd-old']]);
  });
  it('a sort orders inside each section', () => {
    expect(slugs(sections(xs, none, 'dist', '2026-11-20'))[1]).toEqual(['w2', 'w1']);
    expect(slugs(sections(xs, none, 'dist', '2026-11-20'))[2]).toEqual(['d-old', 'd-new']);
  });
  it('filters by region and any of the levels, dropping empty sections', () => {
    expect(slugs(sections(xs, { region: 'jp', diffs: new Set() }, 'auto', '2026-11-20'))).toEqual([['w2']]);
    expect(sections(xs, { region: null, diffs: new Set(['veryhard'] as const) }, 'auto', '2026-11-20').map((x) => x.status)).toEqual(['want']);
    expect(sections(xs, { region: 'us', diffs: new Set(['veryhard'] as const) }, 'auto', '2026-11-20')).toEqual([]);
  });
  it('places every built-in trail once', () => {
    expect(sections(TRAILS, none, 'auto', '2026-11-20').flatMap((s) => s.trails).length).toBe(TRAILS.length);
  });
});
