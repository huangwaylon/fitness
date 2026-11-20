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

describe('a registered hike (trail.user)', () => {
  const u = (slug: string, status: 'done' | 'planned' | 'want', date?: string): Trail => t(slug, { user: { id: slug, status, src: 'manual', who: 'A', track: false, ...(date ? { date } : {}) } });
  it('by its own status: 歩いた, 行きたい, 予定 (undated or its day to come; its day gone, 歩いた)', () => {
    expect(statusOf(u('a', 'done'), '2026-11-21')).toBe('walked');
    expect(statusOf(u('a', 'want', '2026-12-01'), '2026-11-21')).toBe('want');
    expect(statusOf(u('a', 'planned', '2026-11-21'), '2026-11-21')).toBe('planned');
    expect(statusOf(u('a', 'planned'), '2026-11-21')).toBe('planned');
    expect(statusOf(u('a', 'planned', '2026-11-20'), '2026-11-21')).toBe('walked');
  });
  it("among the guide's by its own date (not the trail's record), an undated one last", () => {
    const xs = [
      t('p-late', { plan: plan('2026-12-05') }), t('d-old', { walked: walked('2026-08-09') }), t('w1'), t('p-soon', { plan: plan('2026-11-21') }),
      u('u-plan', 'planned', '2026-11-25'), u('u-plan0', 'planned'), u('u-old', 'done', '2025-05-05'), { ...u('u-new', 'done', '2026-11-10'), walked: walked('2020-01-01') },
      u('u-done0', 'done'), u('u-want', 'want')
    ];
    expect(slugs(sections(xs, none, 'auto', '2026-11-20'))).toEqual([['p-soon', 'u-plan', 'p-late', 'u-plan0'], ['w1', 'u-want'], ['u-new', 'd-old', 'u-old', 'u-done0']]);
  });
});
