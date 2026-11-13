// ボット → 保養所's view (view.ts): the draft and its PUT body (Tokyo's day boundaries), the date notes, まとめて追加
// and each stay's facilities by why (受付終了, the FY's seasons with their gap, 休館日, 掲載終了; an unknown FY never
// 季節外), the facilities merged from the roster and the runner's names (normName, U+FA1A), 施設's three parts and their
// summary agreeing with the bars, the allow-list (derived from a Worker without one), the presets, ★ and off never
// both, the verdict's tones, the poll's pace, the facts, the bookings that need a person (a hold's deadline) and the
// recent events.
import { describe, expect, it } from 'vitest';
import example from '../../../../its/contract-example.json';
import { parseSettingsInput, type ItsStatus, type ScanMinute } from './contract.ts';
import { parseStatus } from './client.ts';
import { D10, D4, ROSTER, fiscalYear, type Region, type RosterHotel } from './roster.ts';
import {
  addDate, addDates, applyPreset, bookingRows, bulkDates, closedOn, controlLine, dateBounds, dateMonths, dateRows, delisted, draftOf, duration, errorText, eventLines, factRows,
  footLine, hotelHint, hotelNote, hotelParts, hotelRows, hotelSummary, legacy, listOrder, needOf, needsAttention, nightOf, pollMs, presetOf, removeDate, rowBadge, sameDraft, saveError,
  savedLine, seasonMiss, setSearch, stopsAtBooked, toInput, toggleSearch, toggleStar, verdictView, weekday, minuteCells, scanSummary, scanTicks, type Draft
} from './view.ts';

const jst = (s: string) => Date.parse(`${s}+09:00`);
/** 2026-11-13 12:00 JST. */
const NOW = jst('2026-11-13T12:00:00');
const TODAY = '2026-11-13';
/** The seasons as FY2026's pages give them (the real table gains a row each fiscal year; 2027 stays unknown here). */
const FY2026 = { 2026: { summer: ['2026-07-01', '2026-09-30'], winter: ['2026-12-19', '2027-03-31'] } } as const;
const STATUS = parseStatus(example.status)!;
const status = (over: Partial<ItsStatus> = {}): ItsStatus => ({ ...STATUS, ...over });
const draft = (over: Partial<Draft> = {}): Draft => ({ ...draftOf(STATUS.settings), ...over });

describe('the draft', () => {
  it('is the settings’ editable part; the same when only the order of dates or skips or their spelling differs', () => {
    const d = draft();
    expect({ ...d, search: [] }).toEqual({ intervalSec: 15, dates: ['2026-11-21', '2026-11-22'], guests: 2, search: [], skip: ['ゆふいん山水館', 'ブルーベリーヒル勝浦'], priority: ['NAGU'], autoConfirm: false });
    expect(sameDraft(d, draft({ dates: ['2026-11-22', '2026-11-21'], skip: ['ﾌﾞﾙｰﾍﾞﾘｰﾋﾙ勝浦', 'ゆふいん 山水館'] }))).toBe(true);
    expect(sameDraft(d, draft({ priority: ['nagu'] }))).toBe(true);
    expect(sameDraft(d, draft({ priority: ['NAGU', 'リソル'] }))).toBe(false);
    expect(sameDraft(draft({ priority: ['a', 'b'] }), draft({ priority: ['b', 'a'] }))).toBe(false);   // priority is an order
    expect(sameDraft(d, draft({ guests: 3 }))).toBe(false);
    expect(sameDraft(d, draft({ autoConfirm: true }))).toBe(false);
    expect(sameDraft(d, removeDate(d, '2026-11-21'))).toBe(false);
  });

  it('becomes a body the Worker takes, from the updatedAt it began at', () => {
    const body = toInput(draft(), 1794540000000, NOW);
    expect({ ...body, search: undefined }).toEqual({ ...example.settingsInput, search: undefined });
    // the Worker keeps the allow-list as sent (its spaces folded)
    expect(parseSettingsInput(body, NOW)).toEqual({ ok: true, value: { ...body, search: body.search.map((n) => n.replace(/\s+/g, ' ')) } });
  });

  it('drops a stay that passed in Tokyo while it was open (so the body still passes)', () => {
    const d = draft({ dates: ['2026-11-13', '2026-11-20'] });
    expect(toInput(d, null, jst('2026-11-13T23:59:00')).dates).toEqual(['2026-11-13', '2026-11-20']);
    const after = toInput(d, null, jst('2026-11-14T00:00:00'));
    expect(after.dates).toEqual(['2026-11-20']);
    expect(parseSettingsInput(after, jst('2026-11-14T00:00:00')).ok).toBe(true);
    // the phone's UTC day doesn't matter: 2026-11-13T15:00Z is already the 14th in Tokyo
    expect(toInput(d, null, Date.parse('2026-11-13T15:00:00Z')).dates).toEqual(['2026-11-20']);
  });

  it('adds a date from tonight (Tokyo) to MAX_DAYS_AHEAD, once, at most MAX_DATES', () => {
    const d = draft({ dates: [] });
    expect(dateBounds(Date.parse('2026-11-13T15:30:00Z'))).toEqual({ min: '2026-11-14', max: '2027-12-19' });
    expect(addDate(d, '2026-11-13', NOW)).toMatchObject({ ok: true, draft: { dates: ['2026-11-13'] } });
    expect(addDate(d, '2026-11-13', Date.parse('2026-11-13T15:30:00Z'))).toEqual({ ok: false, why: 'past' });
    expect(addDate(d, '2027-12-18', NOW).ok).toBe(true);
    expect(addDate(d, '2027-12-19', NOW)).toEqual({ ok: false, why: 'far' });
    expect(addDate(d, '2026-02-30', NOW)).toEqual({ ok: false, why: 'bad' });
    expect(addDate(draft(), '2026-11-21', NOW)).toEqual({ ok: false, why: 'dup' });
    const full = draft({ dates: Array.from({ length: 20 }, (_, i) => `2026-12-${String(i + 1).padStart(2, '0')}`) });
    expect(addDate(full, '2027-01-05', NOW)).toEqual({ ok: false, why: 'full' });
    // stays already past in Tokyo (hidden, never sent) don't count toward MAX_DATES, and leave the draft
    const stale = draft({ dates: [...Array.from({ length: 19 }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`), '2026-11-12', '2026-11-20'] });
    const added = addDate(stale, '2026-11-21', NOW);
    expect(added.ok && added.draft.dates).toEqual(['2026-11-20', '2026-11-21']);
    expect(addDate(stale, '2026-11-12', NOW)).toEqual({ ok: false, why: 'past' });
    expect(addDate(draft({ dates: ['2026-11-12'] }), '2026-11-20', NOW)).toMatchObject({ ok: true, draft: { dates: ['2026-11-20'] } });
    const r = addDate(draft(), '2026-11-15', NOW);
    expect(r.ok && r.draft.dates).toEqual(['2026-11-15', '2026-11-21', '2026-11-22']);
    expect(r.ok && parseSettingsInput(toInput(r.draft, null, NOW), NOW).ok).toBe(true);
  });
});

describe('dateRows', () => {
  it('counts days in Tokyo and notes 自動で確定, the D−4 facilities and the passed deadlines', () => {
    const d = draft({ dates: ['2026-11-25', '2026-11-24', '2026-11-23', '2026-11-20', '2026-11-16', '2026-11-13'], autoConfirm: true });
    expect(dateRows(d, NOW).map((r) => [r.date, r.days, r.note, r.text])).toEqual([
      ['2026-11-13', 0, 'late', '今夜 · 申込期限切れ'],
      ['2026-11-16', 3, 'late', 'あと3日 · 申込期限切れ'],
      ['2026-11-20', 7, 'd4', 'あと7日 · 4日前までの施設のみ'],
      ['2026-11-23', 10, null, 'あと10日'],
      ['2026-11-24', 11, 'auto', 'あと11日 · 自動で確定'],
      ['2026-11-25', 12, 'auto', 'あと12日 · 自動で確定']
    ]);
    expect(dateRows(d, NOW)[0].label).toBe('11月13日(金)');
    expect(dateRows({ ...d, autoConfirm: false }, NOW).at(-1)!.note).toBeNull();
    // a minute past midnight in Tokyo the 23rd is 9 days away: D−4 only
    expect(dateRows(d, jst('2026-11-14T00:01:00')).find((r) => r.date === '2026-11-23')!.note).toBe('d4');
  });
  it('tonight is day 0; a stay already past in Tokyo isn’t listed', () => {
    const d = draft({ dates: ['2026-11-12', '2026-11-13', '2026-11-14'] });
    expect(dateRows(d, NOW).map((r) => [r.date, r.text])).toEqual([['2026-11-13', '今夜 · 申込期限切れ'], ['2026-11-14', 'あと1日 · 申込期限切れ']]);
    expect(dateRows(d, jst('2026-11-14T00:00:00')).map((r) => r.date)).toEqual(['2026-11-14']);
  });
});

describe('the stays: まとめて追加, months, what can take each', () => {
  it('adds a period’s chosen weekdays from tonight, less those listed, up to MAX_DATES', () => {
    const d = draft({ dates: ['2026-11-21'] });
    // 11/13 (金) to 11/30: Fridays and Saturdays, the 21st already listed
    expect(bulkDates(d, '2026-11-13', '2026-11-30', [5, 6], NOW)).toEqual({ add: ['2026-11-13', '2026-11-14', '2026-11-20', '2026-11-27', '2026-11-28'], over: 0 });
    expect(bulkDates(d, '2026-11-30', '2026-11-13', [5, 6], NOW).add).toHaveLength(5);   // either order
    expect(bulkDates(d, '2026-11-01', '2026-11-14', [5, 6], NOW).add).toEqual(['2026-11-13', '2026-11-14']);   // nothing past
    expect(bulkDates(d, '2026-11-13', '2026-11-30', [], NOW).add).toEqual([]);
    expect(bulkDates(d, '', '2026-11-30', [5], NOW).add).toEqual([]);
    expect(bulkDates(d, '2027-12-17', '2028-01-30', [0, 1, 2, 3, 4, 5, 6], NOW).add).toEqual(['2027-12-17', '2027-12-18']);   // MAX_DAYS_AHEAD
    const year = bulkDates(draft({ dates: [] }), '2026-11-14', '2027-11-14', [0, 1, 2, 3, 4, 5, 6], NOW);
    expect([year.add.length, year.over]).toEqual([20, 346]);
    expect(weekday('2026-11-15')).toBe(0);
    const added = addDates(draft({ dates: ['2026-11-12', '2026-11-21'] }), ['2026-11-20', '2026-11-21'], NOW);
    expect(added.dates).toEqual(['2026-11-20', '2026-11-21']);
    expect(parseSettingsInput(toInput(added, null, NOW), NOW).ok).toBe(true);
  });

  it('heads the stays by month', () => {
    const rows = dateRows(draft({ dates: ['2026-12-01', '2026-11-21', '2027-01-09', '2026-11-22'] }), NOW);
    expect(dateMonths(rows).map((m) => [m.label, m.rows.map((r) => r.date)])).toEqual([
      ['2026年11月', ['2026-11-21', '2026-11-22']], ['2026年12月', ['2026-12-01']], ['2027年1月', ['2027-01-09']]
    ]);
  });

  const R = (name: string, kind: RosterHotel['kind'], cutoff: 4 | 10 | null, region: Region = 'kanto', area = 'か'): RosterHotel => ({ name, region, area, kind, cutoff, verified: true });
  const roster = [R('四日', 'year', 4, 'kanto', 'い'), R('十日', 'year', 10, 'kanto', 'あ'), R('夏', 'summer', 4), R('冬', 'winter', 4), R('冬と夏', 'both', 4), R('契約なし', null, null)];
  const every = (dates: string[], over: Partial<Draft> = {}) => draft({ search: roster.map((r) => r.name).concat('新顔'), skip: [], priority: [], dates, ...over });

  it('the fiscal year’s seasons: 夏季 7/1–9/30, 冬季 12/19–3/31, 夏季・冬季 neither in 10/1–12/18; an unknown FY never 季節外', () => {
    expect([fiscalYear('2026-04-01'), fiscalYear('2027-03-31'), fiscalYear('2027-04-01')]).toEqual([2026, 2026, 2027]);
    const miss = (kind: RosterHotel['kind'] | undefined, dates: string[]) => dates.map((x) => seasonMiss(kind, x, FY2026));
    expect(miss('summer', ['2026-06-30', '2026-07-01', '2026-09-30', '2026-10-01', '2027-03-31'])).toEqual(['夏季は7/1から', null, null, '夏季は9/30まで', '夏季は9/30まで']);
    expect(miss('winter', ['2026-08-01', '2026-12-18', '2026-12-19', '2027-03-31'])).toEqual(['冬季は12/19〜3/31', '冬季は12/19〜3/31', null, null]);
    expect(miss('both', ['2026-06-30', '2026-09-30', '2026-10-01', '2026-12-18', '2026-12-19', '2027-01-15'])).toEqual(['夏季は7/1から', null, '冬季は12/19から', '冬季は12/19から', null, null]);
    expect(miss('year', ['2026-11-01'])).toEqual([null]);
    expect(miss('direct', ['2026-11-01'])).toEqual([null]);
    expect(miss(undefined, ['2026-11-01'])).toEqual([null]);
    // a year without a row: nothing is out of season, and the night says the seasons aren't known
    expect(miss('summer', ['2027-04-01', '2027-10-01'])).toEqual([null, null]);
    expect(miss('both', ['2027-11-01'])).toEqual([null]);
    expect(seasonMiss('summer', '2099-11-01')).toBeNull();   // the real table: a year it has no row for
  });

  it('利用不可日 by fiscal year: NAGU 勝浦’s Tuesdays and Wednesdays and its new year, the others’ dates', () => {
    const of = (n: string) => ROSTER.find((r) => r.name === n)!;
    const nagu = of('NAGU 勝浦');
    expect([weekday('2026-12-22'), weekday('2026-12-23'), weekday('2026-12-24')]).toEqual([2, 3, 4]);
    expect(['2026-12-22', '2026-12-23', '2026-12-24', '2026-12-31', '2027-01-03', '2027-01-04'].map((x) => closedOn(nagu, x))).toEqual([
      'NAGU 勝浦は火・水曜休み', 'NAGU 勝浦は火・水曜休み', null, 'NAGU 勝浦は休館日', 'NAGU 勝浦は休館日', null
    ]);
    expect(closedOn(nagu, '2099-04-07')).toBeNull();   // a Tuesday in a year without a row
    expect(['2027-02-14', '2027-02-15', '2027-02-18', '2027-02-19'].map((x) => closedOn(of('蓼科東急ホテル'), x) !== null)).toEqual([false, true, true, false]);
    expect(['2026-07-23', '2026-07-24', '2026-07-26', '2026-12-30', '2027-01-02', '2027-01-03'].map((x) => closedOn(of('NASPAニューオータニ'), x) !== null)).toEqual([false, true, true, true, true, false]);
    expect(['2026-12-31', '2027-02-24', '2027-02-26'].map((x) => closedOn(of('ラビスタ函館ベイANNEX'), x) !== null)).toEqual([true, true, false]);
    expect(['2026-12-29', '2026-12-30', '2027-01-03', '2027-01-04'].map((x) => closedOn(of('ホテル日航アリビラ'), x) !== null)).toEqual([false, true, true, false]);
    expect(closedOn(of('リソルの森'), '2026-12-22')).toBeNull();
    expect(closedOn(null, '2026-12-22')).toBeNull();
    // on a night: 受付終了 first, then 季節外 (a Tuesday in the gap is 季節外), then 休館日
    const row = hotelRows(draft({ search: ['NAGU 勝浦'] }), []).find((r) => r.name === 'NAGU 勝浦')!;
    expect(nightOf(row, '2026-12-22', 39)).toEqual({ why: 'closed', line: 'NAGU 勝浦は火・水曜休み' });
    expect(nightOf(row, '2026-11-24', 11)).toEqual({ why: 'season', line: '冬季は12/19から' });
    expect(nightOf(row, '2026-12-22', 3)).toEqual({ why: 'cutoff', line: '4日前までの施設：12月18日で受付終了' });
    expect(nightOf(row, '2026-12-24', 39)).toEqual({ why: 'check', line: null });
  });

  it('a night’s searched facilities by why: 探す, 受付終了 (its last day), 季節外, 掲載終了; the new ones D−4; VoiceOver’s line', () => {
    const d = every(['2026-11-15', '2026-11-20', '2026-11-30', '2026-12-18', '2026-12-19', '2027-03-31', '2027-04-01', '2027-10-01']);
    const rows = hotelRows(d, ['新顔'], null, roster);
    const dr = dateRows(d, NOW, rows, [], true, FY2026);
    expect(dr.map((r) => [r.date, r.able])).toEqual([
      ['2026-11-15', []],
      ['2026-11-20', ['四日', '新顔']],
      ['2026-11-30', ['四日', '十日', '新顔']],
      ['2026-12-18', ['四日', '十日', '新顔']],
      ['2026-12-19', ['四日', '十日', '冬', '冬と夏', '新顔']],
      ['2027-03-31', ['四日', '十日', '冬', '冬と夏', '新顔']],
      ['2027-04-01', ['四日', '十日', '夏', '冬', '冬と夏', '新顔']],
      ['2027-10-01', ['四日', '十日', '夏', '冬', '冬と夏', '新顔']]
    ]);
    expect(dr.every((r) => r.nights.size === 7)).toBe(true);
    // under D4 days: every facility 受付終了 (the bar fully hatched)
    expect(dr[0].parts.map((p) => [p.why, p.names.length])).toEqual([['cutoff', 7]]);
    expect(dr[1].parts).toEqual([
      { why: 'check', names: ['四日', '新顔'], lines: [] },
      { why: 'cutoff', names: ['十日'], lines: ['10日前までの施設：11月10日で受付終了'] },
      { why: 'season', names: ['夏', '冬', '冬と夏'], lines: ['夏季は9/30まで', '冬季は12/19〜3/31', '冬季は12/19から'] },
      { why: 'gone', names: ['契約なし'], lines: [] }
    ]);
    expect(dr[1].aria).toBe('11月20日(金)、あと7日、4日前までの施設のみ。7件中2件を探しています。受付終了で1件、季節外で3件、掲載終了で1件除外。');
    expect(dr[2].aria).toBe('11月30日(月)、あと17日。7件中3件を探しています。季節外で3件、掲載終了で1件除外。');
    expect(dr.map((r) => r.noSeason)).toEqual([false, false, false, false, false, false, true, true]);
    // only the searched; ★ first in the order
    const off = setSearch(every(['2026-12-19'], { priority: ['冬と夏'] }), ['四日'], false);
    expect(dateRows(off, NOW, hotelRows(off, ['新顔'], null, roster))[0]).toMatchObject({ able: ['冬と夏', '十日', '冬', '新顔'] });
    // and none searched: an empty bar
    const none = every(['2026-12-19'], { search: [] });
    expect(dateRows(none, NOW, hotelRows(none, [], null, roster))[0]).toMatchObject({ able: [], parts: [], aria: '12月19日(土)、あと36日。0件中0件を探しています。' });
  });

  it('施設 in three parts: 探す (★ first, 「12/19のみ」), 日程に合わない (the reason across the nights), 除外; the summary agrees with the bars', () => {
    const r3 = [...roster, R('外す', 'year', 4, 'near')];
    const d = every(['2026-11-20', '2026-12-19'], { skip: ['外す'], priority: ['冬と夏', '夏'] });
    const rows = hotelRows(d, ['新顔'], null, r3);
    const dr = dateRows(d, NOW, rows);
    const p = hotelParts(rows, dr);
    const names = (xs: { name: string }[]) => xs.map((r) => r.name);
    expect([names(p.search), names(p.starred), p.regions.map((g) => [g.id, g.label, names(g.rows)]), names(p.unfit), names(p.off)]).toEqual([
      ['冬と夏', '四日', '十日', '冬', '新顔'], ['冬と夏'], [['kanto', '関東', ['四日', '十日', '冬']], ['new', '新しい施設', ['新顔']]], ['夏', '契約なし'], ['外す']
    ]);
    const meta = Object.fromEntries([...p.search, ...p.unfit, ...p.off].map((r) => [r.name, [r.meta, r.fresh, r.label]]));
    expect(meta).toEqual({
      冬と夏: ['か · 夏季・冬季 · 4日前まで · 12/19のみ', false, '冬と夏、探す、12/19のみ'],
      十日: ['あ · 通年 · 10日前まで · 12/19のみ', false, '十日、探す、12/19のみ'],
      四日: ['い · 通年 · 4日前まで', false, '四日、探す'],
      冬: ['か · 冬季 · 4日前まで · 12/19のみ', false, '冬、探す、12/19のみ'],
      新顔: ['新しい施設', true, '新顔、探す'],
      夏: ['季節外（夏季は9/30まで）', false, '夏、探す、季節外（夏季は9/30まで）'],
      契約なし: ['掲載終了', false, '契約なし、探す、掲載終了'],
      外す: ['か · 通年 · 4日前まで', false, '外す、除外']
    });
    // ★ keeps its star in 日程に合わない; the summary's ★ only those that can take the nights
    expect(p.unfit.find((r) => r.name === '夏')!.star).toBe(1);
    expect(hotelSummary(p)).toEqual({ title: 'この日程で探す施設 5件', line: '関東 4・新しい施設 1 · ★ 冬と夏', more: 'ほか2件は日程に合いません' });
    // the bars: every facility a night searches is in 探す, every one in 探す is searched on some night, the rest searched are 日程に合わない
    const checked = new Set(dr.flatMap((r) => r.able));
    expect([...checked].sort()).toEqual(names(p.search).sort());
    expect(dr.every((r) => r.nights.size === p.search.length + p.unfit.length)).toBe(true);
    // a night past every cutoff is left out (else every row 「のみ」, every reason 受付終了), unless it's the only kind
    const late = every(['2026-11-15', '2026-11-20']);
    const lr = hotelRows(late, [], null, roster);
    const lp = hotelParts(lr, dateRows(late, NOW, lr));
    expect([lp.unfit.find((r) => r.name === '夏')!.meta, lp.unfit.find((r) => r.name === '十日')!.meta]).toEqual(['季節外（夏季は9/30まで）', '申込は10日前まで（11/10で受付終了）']);
    expect(lp.search.find((r) => r.name === '四日')!.meta).toBe('い · 通年 · 4日前まで');
    const only = every(['2026-11-15']);
    const op = hotelParts(hotelRows(only, [], null, roster), dateRows(only, NOW, hotelRows(only, [], null, roster)));
    expect([op.search.length, op.unfit.length]).toEqual([0, 7]);
    // 「…のみ」 names three nights, then how many more
    const many = every(['2026-11-20', '2026-12-19', '2026-12-20', '2026-12-21', '2026-12-22']);
    const mr = hotelRows(many, [], null, roster);
    expect(hotelParts(mr, dateRows(many, NOW, mr)).search.find((r) => r.name === '冬')!.meta).toBe('か · 冬季 · 4日前まで · 12/19・12/20・12/21ほか1日のみ');

    // no nights (or only booked ones): every searched facility in 探す, none 「のみ」
    expect(hotelParts(rows, []).unfit).toEqual([]);
    expect(hotelParts(rows, []).search.every((r) => !r.meta.includes('のみ'))).toBe(true);
    const booked = dateRows(d, NOW, rows, [{ id: 'r:1', kind: 'confirmed', date: '2026-11-20', hotel: '四日', number: 'A1', at: NOW, runId: 'r' }]);
    expect(names(hotelParts(rows, booked).search)).toEqual(['冬と夏', '四日', '十日', '冬', '新顔']);
    expect(hotelParts(rows, booked).search.every((r) => !r.meta.includes('のみ'))).toBe(true);
    expect(hotelSummary(hotelParts([], []))).toEqual({ title: 'この日程で探す施設 0件', line: '', more: null });
  });

  it('the real roster: 11/16 past every cutoff, 11/21 only the D−4 ones, 11/24 the D−10 too: 「11/24のみ」; NAGU 勝浦 out of season, then closed on Tuesdays', () => {
    const d = draft({ dates: ['2026-11-16', '2026-11-21', '2026-11-24'] });
    const rows = hotelRows(d, []);
    const dr = dateRows(d, NOW, rows);
    expect(dr[0].parts.map((x) => x.why)).toEqual(['cutoff']);
    expect(dr[0].note).toBe('late');
    const p = hotelParts(rows, dr);
    expect(p.search.find((r) => r.name === 'トスラブ箱根ビオーレ')!.meta).toBe('箱根 · 直営 · 4日前まで');
    expect(p.search.find((r) => r.name === 'ホテルハーヴェスト那須')!.meta).toBe('那須 · 通年 · 10日前まで · 11/24のみ');
    expect(p.unfit.find((r) => r.name === 'NAGU 勝浦')).toMatchObject({ meta: '季節外（冬季は12/19から）', star: 0 });
    expect(new Set(dr.flatMap((r) => r.able))).toEqual(new Set(p.search.map((r) => r.name)));
    expect(hotelSummary(p).line).not.toContain('★');   // ★ NAGU can't take these nights
    // a Tuesday in the season gap and one in winter: both reasons, in the bar's order
    const nagu = draft({ dates: ['2026-11-24', '2026-12-22'] });
    const nr = hotelRows(nagu, []);
    expect(hotelParts(nr, dateRows(nagu, NOW, nr)).unfit.find((r) => r.name === 'NAGU 勝浦')!.meta).toBe('季節外（冬季は12/19から）・休館日');
  });

  it('a stay with a 予約確定 says it is booked and no longer searched', () => {
    const b = { id: 'r:1', kind: 'confirmed' as const, date: '2026-11-21', hotel: 'NAGU 勝浦', number: 'A1', at: NOW, runId: 'r' };
    const rows = dateRows(draft(), NOW, hotelRows(draft(), []), [b, { ...b, kind: 'hold', date: '2026-11-22' }]);
    expect(rows.map((r) => [r.date, r.note, r.text, r.able.length > 0])).toEqual([
      ['2026-11-21', 'booked', 'あと8日 · 予約済み・探していません', false], ['2026-11-22', 'd4', 'あと9日 · 4日前までの施設のみ', true]
    ]);
    // a runner from before (it keeps looking): only 予約済み
    expect(dateRows(draft(), NOW, hotelRows(draft(), []), [b], false)[0].text).toBe('あと8日 · 予約済み');
  });

  it('claims what the runner does once one has reported', () => {
    expect(stopsAtBooked(status({ runner: null }))).toBe(false);
    expect(stopsAtBooked(status({ runner: { ...STATUS.runner!, settingsAt: null } }))).toBe(true);
    expect(parseStatus({ ...example.status, runner: { ...example.status.runner, settingsAt: 5 } })!.runner!.settingsAt).toBe(5);
    const { settingsAt: _, ...lagging } = example.status.runner;   // a runner that lags behind the contract: null
    expect(parseStatus({ ...example.status, runner: lagging })!.runner!.settingsAt).toBeNull();
    // 施設's line: 申込 only with 自動で確定, a booked night only from a runner that stops
    expect(hotelHint(true, true)).toBe('空きが出た施設はすべて仮押さえします。★の施設から順に申込し、予約が確定した日はそれ以上探しません。');
    expect(hotelHint(true, false)).toBe('空きが出た施設はすべて仮押さえします。★の施設から順に申込します。');
    expect(hotelHint(false, true)).toBe('空きが出た施設は★の施設から順にすべて仮押さえします。申込はメールから行ってください。');
    expect(hotelHint(false, false)).not.toContain('申込し');
  });
});

describe('hotelRows', () => {
  const R = (name: string, region: Region, verified = true, over: Partial<RosterHotel> = {}): RosterHotel => ({ name, region, area: 'どこ', kind: 'year', cutoff: 10, verified, ...over });
  const roster = [R('鳴子温泉　湯元　吉祥', 'far'), R('NAGU 勝浦', 'kanto'), R('リソルの森', 'kanto', false), R('ゆふいん山水館', 'far'), R('ホテル日航アリビラ', 'far'), R('熱海後楽園ホテル', 'near')];
  /** Every listed name searched (the allow-list), nothing skipped or starred. */
  const open = (over: Partial<Draft> = {}) => draft({ search: [...roster.map((r) => r.name)], skip: [], priority: [], ...over });

  it('merges the runner’s names into the roster by normName (U+FA1A, full-width spaces), a stable order by group, the rest as new', () => {
    const rows = hotelRows(open(), ['鳴子温泉 湯元 吉祥', 'ＮＡＧＵ　勝浦', '新しいホテル'], null, roster);
    expect(rows.map((r) => [r.name, r.group, r.fresh])).toEqual([
      ['NAGU 勝浦', 'kanto', false], ['リソルの森', 'kanto', false], ['熱海後楽園ホテル', 'near', false],
      ['鳴子温泉　湯元　吉祥', 'far', false], ['ゆふいん山水館', 'far', false], ['ホテル日航アリビラ', 'far', false], ['新しいホテル', 'new', true]
    ]);
    // 探す is the allow-list: the new one is in it nowhere, so undecided (the banner), not searched
    expect(rows.filter((r) => !r.search).map((r) => [r.name, r.undecided])).toEqual([['新しいホテル', true]]);
    // a switch or a ★ never moves a row
    const after = hotelRows(toggleStar(toggleSearch(open(), rows[0]), 'ホテル日航アリビラ'), ['新しいホテル'], null, roster);
    expect(after.map((r) => r.name)).toEqual(rows.map((r) => r.name));
    expect(after.find((r) => r.name === 'NAGU 勝浦')).toMatchObject({ search: false, undecided: false });
  });

  it('numbers ★ in priority order (a priority entry is a substring); skipping wins over the allow-list', () => {
    const rows = hotelRows(open({ skip: ['ゆふいん 山水館', '消えた施設'], priority: ['アリビラ', 'nagu'] }), [], null, roster);
    expect(rows.filter((r) => r.star !== null).map((r) => [r.name, r.star])).toEqual([['NAGU 勝浦', 1], ['ホテル日航アリビラ', 0]]);
    expect(rows.filter((r) => !r.search).map((r) => [r.name, r.group, r.undecided])).toEqual([['ゆふいん山水館', 'far', false], ['消えた施設', 'new', false]]);
    // a priority entry naming nothing listed still shows (★, so it can be taken off)
    expect(hotelRows(open({ search: ['どこか'], priority: ['どこか'] }), [], null, roster).at(-1)).toMatchObject({ name: 'どこか', star: 0, roster: null });
  });

  it('notes the area, the roster’s kind and cutoff, or 新しい施設 (名前未確認 and 似た名前 not on the rows)', () => {
    const rows = hotelRows(open(), ['新しいホテル'], null, roster);
    expect(rows.map(hotelNote)).toEqual([...Array(6).fill('どこ · 通年 · 10日前まで'), '新しい施設']);
    expect(hotelNote({ ...rows[0], roster: null, fresh: false })).toBe('');
  });

  it('keeps a saved entry listed after the draft lets it go (on no roster, never seen)', () => {
    const saved = { search: ['昔の施設'], skip: ['消えた施設'], priority: ['どこか'] };
    const d = open();
    expect(hotelRows(d, [], null, roster).map((r) => r.name)).not.toContain('消えた施設');
    expect(hotelRows(d, [], saved, roster).filter((r) => r.roster === null).map((r) => [r.name, r.search, r.undecided])).toEqual([
      ['昔の施設', false, true], ['消えた施設', false, true], ['どこか', false, true]
    ]);
  });

  it('links an unverified roster name and a site name, one inside the other: 探す on one doesn’t cover the other', () => {
    const d = open({ skip: ['リソルの森'] });
    const rows = hotelRows(d, ['リソルの森 グランヴォー スパヴィレッジ'], null, roster);
    const site = rows.find((r) => r.fresh)!;
    expect([site.name, site.search, site.similar]).toEqual(['リソルの森 グランヴォー スパヴィレッジ', false, 'リソルの森']);
    expect(hotelNote(site)).toBe('新しい施設');   // (似た名前: the new facility's banner says it)
    expect(rows.find((r) => r.name === 'リソルの森')!.similar).toBe('リソルの森 グランヴォー スパヴィレッジ');
    // a verified roster name isn't linked (its spelling is the site's)
    expect(hotelRows(d, ['NAGU 勝浦 別館'], null, roster).every((r) => r.similar === null)).toBe(true);
  });

  it('keeps ★ and off apart: off drops the priority, ★ searches', () => {
    const d = open({ priority: ['NAGU'] });
    const off = setSearch(d, ['NAGU 勝浦'], false);
    expect([off.search.includes('NAGU 勝浦'), off.skip, off.priority]).toEqual([false, ['NAGU 勝浦'], []]);
    const starred = toggleStar(off, 'NAGU 勝浦');
    expect([starred.search.includes('NAGU 勝浦'), starred.skip, starred.priority]).toEqual([true, [], ['NAGU 勝浦']]);
    expect(toggleStar(starred, 'ＮＡＧＵ 勝浦').priority).toEqual([]);
    expect(sameDraft(setSearch(setSearch(d, ['リソルの森'], false), ['リソルの森'], true), d)).toBe(true);
    // a site's name past MAX_NAME: ★ keeps its first MAX_NAME UTF-16 units (whole code points), which still names it
    const long = `${'𠮷'.repeat(30)}${'あ'.repeat(120)}`;   // 180 UTF-16 units (a site's name is at most 200)
    const longStar = toggleStar(d, long);
    const entry = longStar.priority[1];
    expect(entry.length).toBeLessThanOrEqual(80);
    expect(entry).toBe(`${'𠮷'.repeat(30)}${'あ'.repeat(20)}`);
    expect(long.startsWith(entry)).toBe(true);
    expect(hotelRows(longStar, [long]).find((r) => r.name === long)?.star).toBe(1);
    expect(toggleStar(longStar, long).priority).toEqual(['NAGU']);
    const odd = toggleStar(d, `${'あ'.repeat(79)}𠮷${'い'.repeat(10)}`).priority[1];
    expect(odd).toBe('あ'.repeat(79));   // never half a surrogate pair
    // every draft it makes still passes the contract
    for (const x of [off, starred, longStar]) expect(parseSettingsInput(toInput(x, null, NOW), NOW).ok).toBe(true);
  });

  it('orders the list: ★ in priority order, then 関東 / 近郊 / 遠方 / 新しい施設, an area’s rows together, the areas in the roster’s order', () => {
    const r2 = [R('京', 'far', true, { area: '京都' }), R('箱', 'kanto', true, { area: '箱根' }), R('熱', 'near', true, { area: '熱海' }), R('勝', 'kanto', true, { area: '勝浦' }), R('箱2', 'kanto', true, { area: '箱根' })];
    const rows = hotelRows(draft({ search: [...r2.map((r) => r.name), '新'], skip: [], priority: ['熱', '京'] }), ['新'], null, r2);
    expect(listOrder(rows).map((r) => r.name)).toEqual(['熱', '京', '箱', '箱2', '勝', '新']);
  });

  it('presets: 関東だけ, 近郊まで, 全部; the one matching is shown', () => {
    const r2 = [...roster, R('トスラブ箱根ビオーレ', 'kanto', true, { kind: 'direct', cutoff: 4 }), R('スキージャム勝山', 'far', false, { kind: null, cutoff: null })];
    const rows = (d: Draft) => hotelRows(d, ['新しいホテル'], null, r2);
    const base = open({ priority: ['NAGU', 'アリビラ'] });
    const on = (d: Draft) => rows(d).filter((r) => r.search).map((r) => r.name);
    const kanto = applyPreset(base, rows(base), 'kanto');
    expect(on(kanto)).toEqual(['NAGU 勝浦', 'リソルの森', 'トスラブ箱根ビオーレ']);
    expect(kanto.priority).toEqual(['NAGU']);   // ★ goes with the facilities switched off
    expect(presetOf(rows(kanto))).toBe('kanto');
    expect(on(applyPreset(base, rows(base), 'near'))).toEqual(['NAGU 勝浦', 'リソルの森', 'トスラブ箱根ビオーレ', '熱海後楽園ホテル']);
    const all = applyPreset(kanto, rows(kanto), 'all');
    // 全部: every row but the one on no roster (スキージャム勝山), which only its own switch turns on
    expect(rows(all).filter((r) => !r.search).map((r) => r.name)).toEqual(['スキージャム勝山']);
    expect(rows(all).filter(delisted).map((r) => r.name)).toEqual(['スキージャム勝山']);
    expect(presetOf(rows(all))).toBe('all');
    expect(presetOf(rows(setSearch(all, ['スキージャム勝山'], true)))).toBeNull();
    expect(presetOf(rows(setSearch(all, ['リソルの森'], false)))).toBeNull();
    expect(parseSettingsInput(toInput(kanto, null, NOW), NOW).ok).toBe(true);
  });
});

describe('the allow-list', () => {
  it('saved settings without one (a Worker from before it): derived from the roster and the names seen, less the skipped', () => {
    const legacySettings = { ...STATUS.settings };
    expect(legacy(legacySettings)).toBe(true);
    const d = draftOf(legacySettings, ['NAGU 勝浦', '新しいホテル']);
    expect(d.search).toContain('新しいホテル');
    expect(d.search).toContain('NAGU 勝浦');
    expect(d.search).not.toContain('ゆふいん山水館');
    expect(d.search).not.toContain('ブルーベリーヒル勝浦');
    expect(d.search.length).toBe(ROSTER.length - 2 + 1);
    // the same derivation twice is no change (no draft to save, nothing to ask on leaving)
    expect(sameDraft(d, draftOf(legacySettings, ['NAGU 勝浦', '新しいホテル']))).toBe(true);
    // and the PUT carries it, the skipped left out
    const body = toInput(setSearch(d, ['リソルの森'], false), null, NOW);
    expect(body.search).not.toContain('リソルの森');
    expect(body.skip).toContain('リソルの森');
    expect(parseSettingsInput(body, NOW).ok).toBe(true);
  });
  it('saved with one: taken as it is; a facility offered since is undecided until someone switches it', () => {
    const s = { ...STATUS.settings, search: ['NAGU 勝浦'] };
    expect(legacy(s)).toBe(false);
    expect(draftOf(s, ['新しいホテル']).search).toEqual(['NAGU 勝浦']);
    const rows = hotelRows(draftOf(s), ['新しいホテル']);
    expect(rows.filter((r) => r.search).map((r) => r.name)).toEqual(['NAGU 勝浦']);
    expect(rows.find((r) => r.name === '新しいホテル')).toMatchObject({ group: 'new', undecided: true });
    expect(rows.find((r) => r.name === 'ゆふいん山水館')).toMatchObject({ undecided: false });   // skipped: decided
    expect(sameDraft(draftOf(s), draftOf({ ...s, search: ['ＮＡＧＵ 勝浦'] }))).toBe(true);
    expect(sameDraft(draftOf(s), setSearch(draftOf(s), ['新しいホテル'], true))).toBe(false);
  });
});

describe('the roster', () => {
  it('tags every facility 関東, 近郊 or 遠方, with a known cutoff', () => {
    expect(ROSTER.every((r) => ['kanto', 'near', 'far'].includes(r.region))).toBe(true);
    expect(ROSTER.every((r) => r.cutoff === null || r.cutoff === D4 || r.cutoff === D10)).toBe(true);
    const of = (n: string) => ROSTER.find((r) => r.name === n)!.region;
    expect([of('トスラブ箱根ビオーレ'), of('ホテルハーヴェスト那須'), of('日光千姫物語')]).toEqual(['kanto', 'kanto', 'kanto']);
    expect([of('熱海後楽園ホテル'), of('ラビスタ富士河口湖'), of('ホテルハーヴェスト旧軽井沢'), of('ホテルハーヴェスト伊東')]).toEqual(['near', 'near', 'near', 'near']);
    expect([of('ホテル日航アリビラ'), of('定山渓 ゆらく草庵'), of('ゆふいん山水館')]).toEqual(['far', 'far', 'far']);
    // the user's moves (2026-11-13)
    expect([of('スパリゾートハワイアンズ モノリスタワー'), of('蓼科東急ホテル'), of('ホテルハーヴェスト斑尾'), of('ホテルハーヴェスト浜名湖'), of('NASPAニューオータニ')]).toEqual(['far', 'far', 'far', 'near', 'near']);
    // an area each (the prefecture where none finer is known), and 利用不可日 only on the five whose pages list them
    expect(ROSTER.every((r) => r.area.length > 0)).toBe(true);
    const area = (n: string) => ROSTER.find((r) => r.name === n)!.area;
    expect([area('トスラブ箱根ビオーレ'), area('ラビスタ熱海テラス'), area('ホテルハーヴェスト旧軽井沢'), area('ホテル日航プリンセス京都')]).toEqual(['箱根', '熱海', '軽井沢', '京都']);
    expect(ROSTER.filter((r) => r.closed).map((r) => r.name).sort()).toEqual(['NAGU 勝浦', 'NASPAニューオータニ', 'ホテル日航アリビラ', 'ラビスタ函館ベイANNEX', '蓼科東急ホテル'].sort());
    expect(ROSTER.filter((r) => r.closed).every((r) => r.kind === 'winter' || r.kind === 'both')).toBe(true);
  });
});

describe('the verdict card and the poll', () => {
  it('gives each verdict its tone and the first reason its sentence', () => {
    expect(verdictView(STATUS)).toEqual({ tone: 'warn', word: '要確認', sentence: '対応が必要な予約があります。' });
    expect(verdictView(status({ verdict: 'healthy', reasons: [] }))).toEqual({ tone: 'good', word: '順調', sentence: '空室を探しています。' });
    expect(verdictView(status({ verdict: 'starting', reasons: ['starting'] })).tone).toBe('good');
    expect(verdictView(status({ verdict: 'late', reasons: ['runner_silent'] })).tone).toBe('warn');
    expect(verdictView(status({ verdict: 'failing', reasons: ['scan_failing'], runner: { ...STATUS.runner!, scanFailures: 4 } }))).toMatchObject({ tone: 'bad', sentence: '空室の確認が4回続けて失敗しています。' });
    for (const v of ['stopped', 'idle', 'off'] as const) expect(verdictView(status({ verdict: v })).tone).toBe('idle');
  });
  it('polls every 15 s while the runner is on its way or running, else every minute', () => {
    expect(pollMs(STATUS)).toBe(15_000);
    expect(pollMs(status({ verdict: 'starting' }))).toBe(15_000);
    expect(pollMs(status({ verdict: 'stopped', settings: { ...STATUS.settings, paused: true } }))).toBe(60_000);
    expect(pollMs(status({ mode: 'off' }))).toBe(60_000);
    expect(pollMs(status({ verdict: 'late' }))).toBe(60_000);
    expect(pollMs(null)).toBe(60_000);
  });
  it('words a refused 保存 by its code, and the foot line’s mode in words', () => {
    expect(saveError('past_date')).toBe('過ぎた日付が含まれています。日付を確認してください。');
    expect(saveError('bad_hotels')).toBe('施設の名前が長すぎるか、多すぎます。');
    expect(saveError('offline')).toBe('保存できませんでした。もう一度保存してください。');
    expect(footLine(STATUS, TODAY)).toBe('稼働 · abc1234 · 更新 13:10');
    expect(footLine(status({ mode: 'off', sha: null }), TODAY)).toBe('オフ · 更新 13:10');
  });
  it('says who pressed 開始 / 停止 last, and when', () => {
    const name = (m: string) => (m === 'B' ? 'うめ' : 'ウェイ');
    expect(controlLine(status({ control: { action: 'stop', by: 'B', at: jst('2026-11-13T12:03:00') } }), name, TODAY)).toBe('停止（うめ・12:03）');
    expect(controlLine(status({ control: { action: 'start', by: 'A', at: jst('2026-11-12T08:00:00') } }), name, TODAY)).toMatch(/^開始（ウェイ・.+8:00）$/);
    expect(controlLine(status({ control: null }), name, TODAY)).toBeNull();
    expect(controlLine(STATUS, name, TODAY)).toBe('開始（ウェイ・12:20）');
  });
});

describe('factRows', () => {
  const today = '2026-11-13';
  it('reads the last report', () => {
    expect(Object.fromEntries(factRows(STATUS, today).map((f) => [f.id, f.value]))).toEqual({
      phase: '空室を確認中', uptime: '12:50から（20分）', report: '13:10', scan: '13:10（120回）', solves: '成功 2 · 失敗 0（前回 19秒）',
      error: '空室の確認 · 時間切れ（13:01）', run: '#19283746'
    });
    // 状態, 最終確認 and 実行 shown; the rest under くわしく
    expect(factRows(STATUS, today).filter((f) => !f.more).map((f) => f.id)).toEqual(['phase', 'scan', 'run']);
    expect(factRows(STATUS, today).find((f) => f.id === 'run')!.href).toBe('https://github.com/huangwaylon/fitness/actions/runs/19283746');
  });
  it('without a report, only 最終報告; a failed dispatch, failures and the unsynced are shown when there are any', () => {
    expect(factRows(status({ runner: null }), today)).toEqual([{ id: 'report', label: '最終報告', value: 'まだ' }]);
    const r = { ...STATUS.runner!, scanFailures: 3, lastOkAt: STATUS.runner!.lastScanAt! - 60_000, unsynced: 1, runUrl: 'https://evil.example/x' };
    const ids = factRows(status({ runner: r, dispatch: { at: STATUS.now, ok: false, status: 403 } }), today).map((f) => f.id);
    expect(ids).toEqual(['dispatch', 'phase', 'scan', 'uptime', 'report', 'ok', 'failures', 'solves', 'error', 'unsynced']);
  });
  it('a runner silent past LATE_AFTER_SEC has ended', () => {
    const later = status({ now: STATUS.now + 50 * 60_000 });
    expect(factRows(later, today).find((f) => f.id === 'phase')!.value).toBe('終了');
    expect(factRows(later, today).find((f) => f.id === 'uptime')!.value).toBe('12:50から（20分）');
  });
  it('words durations', () => {
    expect([duration(40_000), duration(12 * 60_000), duration(130 * 60_000)]).toEqual(['40秒', '12分', '2時間10分']);
  });
});

describe('bookingRows', () => {
  const b = (kind: 'hold' | 'confirming' | 'confirmed' | 'failed', at: number, over: object = {}) => ({ id: `r:${at}`, kind, date: '2026-11-22', hotel: 'NAGU 勝浦', at, runId: 'r', ...over });
  it('a hold with a human_needed after it needs a person, with why', () => {
    expect(bookingRows(STATUS, TODAY)).toMatchObject([{ key: '2026-11-22\nnagu勝浦', state: 'action', date: '2026-11-22', hotel: 'NAGU 勝浦', label: '要対応', detail: '日付が近いため、メールから申込してください' }]);
  });
  it('予約確定 wins over an older human_needed; a hold alone is 仮押さえ; past stays are left out', () => {
    const t0 = STATUS.now;
    const s = status({
      bookings: [b('confirmed', t0 - 1000, { number: 'A123' }), b('hold', t0 - 5000), b('hold', t0 - 9000, { date: '2026-11-21', hotel: 'リソルの森' }), b('hold', t0, { date: '2026-11-12' })]
    });
    expect(bookingRows(s, TODAY).map((r) => [r.state, r.hotel, r.detail])).toEqual([['hold', 'リソルの森', '13:10に仮押さえ'], ['confirmed', 'NAGU 勝浦', '申込受付番号 A123']]);
  });
  it('a failed leg needs a person for 24 h; 申込中 while it’s filed', () => {
    const t0 = STATUS.now;
    const s = status({ events: [], bookings: [b('failed', t0 - 3600_000), b('hold', t0 - 3700_000), b('confirming', t0, { hotel: 'リソルの森' })] });
    expect(bookingRows(s, TODAY).map((r) => [r.state, r.detail])).toEqual([['action', '申込が完了しませんでした。サイトで確認してください'], ['applying', '13:10']]);
    expect(bookingRows(status({ ...s, now: t0 + 86_400_000 }), TODAY).map((r) => r.state)).toEqual(['applying', 'hold']);
  });
  it('a second hold on a night 予約確定 elsewhere, once lapsed, is quiet: 期限切れ, nothing to do', () => {
    const t0 = STATUS.now;
    const s = status({ bookings: [b('confirmed', t0 - 1000, { hotel: 'リソルの森', number: 'A1' }), ...STATUS.bookings] });
    // still live: the hold's own row, as loud as ever
    expect(bookingRows(s, TODAY).map((r) => [r.hotel, r.state])).toEqual([['NAGU 勝浦', 'action'], ['リソルの森', 'confirmed']]);
    const later = bookingRows(s, TODAY, t0 + 16 * 60_000);
    expect(later.map((r) => [r.hotel, r.state, r.label, r.detail, r.left, r.steps])).toEqual([
      ['リソルの森', 'confirmed', '予約確定', '申込受付番号 A1', null, []], ['NAGU 勝浦', 'lapsed', '期限切れ', '確定済みの日・期限切れ', null, []]
    ]);
    expect(rowBadge(status({ ...s, now: t0 + 16 * 60_000 })).word).not.toBe('要対応');
    // a night with no 予約確定: still 期限切れ on its 要対応 row
    expect(bookingRows(STATUS, TODAY, t0 + 16 * 60_000)[0]).toMatchObject({ state: 'action', left: '期限切れ' });
  });
  it('words every human_needed code (a newer runner’s, an older one’s 「leg_…」 or 「code: detail」), else サイトで確認', () => {
    expect(['submit_unknown', 'leg_submit_unknown', 'unmapped: 事業所名', 'not_wanted: the date was removed', 'leg_timeout', 'confirming_unacked', 'leg_bogus', '', 'x'].map(needOf))
      .toEqual(['submit_unknown', 'submit_unknown', 'unmapped', 'not_wanted', 'leg_timeout', 'confirming_unacked', 'other', 'other', 'other']);
    const need = (detail: string) => bookingRows(status({ events: [{ ...STATUS.events[0], detail }] }), TODAY)[0];
    expect(need('submit_unknown').detail).toBe('申込済みの可能性：メールとサイトで確認');
    // one not applied for: finish it by mail before it lapses
    expect(need('lease_stale')).toMatchObject({ detail: '実行が途切れたため申込していません。メールから申込してください', left: 'あと15分ごろで無効' });
    expect(need('lease_stale').steps).toHaveLength(3);
    // one that may have been filed: no mail steps
    expect(need('no_completion').steps).toEqual([]);
  });
});

describe('eventLines', () => {
  it('newest first: the time, what, and the stay, facility and why', () => {
    expect(eventLines(STATUS, TODAY)).toEqual([
      { key: '19283746:4', time: '12:55', what: '要対応', info: '11月22日(日) · NAGU 勝浦 · 日付が近いため、メールから申込してください', bad: true },
      { key: '19283746:3', time: '12:55', what: '仮押さえ', info: '11月22日(日) · NAGU 勝浦', bad: false }
    ]);
    const many = status({ events: Array.from({ length: 15 }, (_, i) => ({ runId: 'r', seq: 15 - i, t: STATUS.now - i, kind: 'run_end' as const, detail: 'time_up' })) });
    expect(eventLines(many, TODAY)).toHaveLength(10);
    expect(eventLines(many, TODAY)[0].info).toBe('時間切れ');
    // the mailbox's failures and the record's, worded
    const err = (detail: string) => eventLines(status({ events: [{ runId: 'r', seq: 1, t: STATUS.now, kind: 'error', detail }] }), TODAY)[0].info;
    expect([err('imap_auth_failed'), err('imap_timeouterror'), err('record_full'), err('something')]).toEqual(['メールの確認 · ログインできず', 'メールの確認 · 時間切れ', '記録がいっぱい', 'something']);
  });
});

describe('a hold’s deadline and what to do', () => {
  it('a hold to finish by mail: the time left from its `at` + HOLD_SEC, the mail, that doing nothing costs nothing, inside D−10 the fee', () => {
    // the example's hold: 12:55, the stay 9 days away, near_date
    const [row] = bookingRows(STATUS, TODAY);
    expect([row.state, row.left, row.expired]).toEqual(['action', 'あと15分ごろで無効', false]);
    expect(row.steps).toEqual(['メール『NAGU 勝浦申込手続きのご案内』→ 申込する → 確認', '何もしなければ自動で取り消されます。料金はかかりません。', '確定後の取り消しは有料です']);
    const later = bookingRows(STATUS, TODAY, STATUS.now + 15 * 60_000)[0];
    expect([later.left, later.expired, later.steps]).toEqual(['期限切れ', true, []]);
    expect(bookingRows(STATUS, TODAY, STATUS.now + 14.5 * 60_000)[0].left).toBe('あと1分ごろで無効');
  });
  it('no fee line for a stay 10+ days away; none of it for a failed leg, an application filed or a reservation', () => {
    const t0 = STATUS.now;
    const far = status({
      bookings: [{ ...STATUS.bookings[0], date: '2026-12-05' }],
      events: [{ ...STATUS.events[0], date: '2026-12-05', detail: 'auto_off' }]
    });
    expect(bookingRows(far, TODAY)[0].steps).toHaveLength(2);
    const b = (kind: 'hold' | 'confirming' | 'confirmed' | 'failed', at: number, over: object = {}) => ({ id: `r:${at}`, kind, date: '2026-12-05', hotel: 'NAGU 勝浦', at, runId: 'r', ...over });
    const rows = bookingRows(status({ events: [], bookings: [b('hold', t0 - 60_000), b('confirming', t0), b('hold', t0 - 60_000, { hotel: 'A' }), b('failed', t0, { hotel: 'A' }), b('hold', t0, { hotel: 'B' }), b('confirmed', t0, { hotel: 'B', number: '1' })] }), TODAY);
    expect(rows.map((r) => [r.hotel, r.state, r.left, r.steps.length])).toEqual([['A', 'action', null, 0], ['NAGU 勝浦', 'applying', null, 0], ['B', 'confirmed', null, 0]]);
    // a hold alone (auto-confirm on its way) shows its time left, no steps
    expect(bookingRows(status({ events: [], bookings: [b('hold', t0)] }), TODAY)[0]).toMatchObject({ state: 'hold', left: 'あと30分ごろで無効', steps: [] });
  });
});

describe('the words', () => {
  it('遅れ says how long nothing was heard; 設定’s row says 要対応 while a booking waits', () => {
    expect(verdictView(status({ verdict: 'late', reasons: ['runner_silent'], now: STATUS.runner!.lastSeen + 52 * 60_000 })).sentence).toBe('52分報告がありません。');
    expect(rowBadge(STATUS)).toEqual({ tone: 'bad', word: '要対応' });
    expect(rowBadge(status({ events: [], bookings: [], verdict: 'healthy', reasons: [] }))).toEqual({ tone: 'good', word: '順調' });
    expect(rowBadge(status({ events: [], bookings: [], verdict: 'stopped' }))).toEqual({ tone: 'idle', word: '停止中' });
  });
  it('ボット’s dot: a hold waiting, 不調 or 遅れ; not 要確認, 停止中 or 順調', () => {
    const quiet = (verdict: ItsStatus['verdict']) => needsAttention(status({ events: [], bookings: [], verdict }));
    expect(needsAttention(STATUS)).toBe(true);
    expect([quiet('failing'), quiet('late')]).toEqual([true, true]);
    expect([quiet('healthy'), quiet('degraded'), quiet('stopped'), quiet('off'), quiet('idle'), quiet('starting')]).toEqual([false, false, false, false, false, false]);
  });
  it('who saved the settings last', () => {
    const name = (m: string) => (m === 'B' ? 'うめ' : 'ウェイ');
    expect(savedLine(status({ settings: { ...STATUS.settings, updatedBy: 'B', updatedAt: jst('2026-11-13T12:03:00') } }), name, TODAY)).toBe('設定の変更：うめ・12:03');
    expect(savedLine(status({ settings: { ...STATUS.settings, updatedBy: null, updatedAt: null } }), name, TODAY)).toBeNull();
  });
  it('words the last error: the step and the outcome, an unknown code as it is', () => {
    const e = (step: string, cls: string) => errorText({ at: 0, step, status: null, cls });
    expect(e('calendar_get', 'timeout')).toBe('空室の確認 · 時間切れ');
    expect(e('calendar_get', 'http_503')).toBe('空室の確認 · サイトの応答 503');
    expect(e('solve', 'chrome_TimeoutException')).toBe('認証 · ブラウザの不具合');
    expect(e('step9_final', 'no_completion')).toBe('仮押さえ · 完了画面が出ず');
    expect(e('imap', 'web_login_required')).toBe('メールの確認 · ウェブでのログインが必要');
    expect([e('imap', 'no_credentials'), e('imap', 'login_rejected'), e('imap', 'gaierror'), e('imap', 'sslerror'), e('bookings', 'bad_booking')])
      .toEqual(['メールの確認 · メールの設定なし', 'メールの確認 · ログインできず', 'メールの確認 · 接続できず', 'メールの確認 · 暗号化の失敗', '予約の記録 · 記録の形式違い']);
    expect(e('thread', 'KeyError')).toBe('thread · KeyError');
  });
});

describe('直近1時間', () => {
  const at = (s: string) => jst(`2026-11-13T${s}`);
  const m = (time: string, over: Partial<ScanMinute> = {}): ScanMinute => ({ minute: at(time), n: 4, ok: 4, fail: 0, avail: 0, ...over });
  it('the last 60 Tokyo minutes up to now’s from the Worker’s per-minute aggregate (recentMinutes), oldest first: a failure red, else a room yellow (the most nights with one), else green; a gap empty', () => {
    const now = at('12:00:30');
    const cells = minuteCells([m('11:00:00'), m('11:01:00', { avail: 2 }), m('11:30:00', { ok: 1, fail: 3, avail: 1, codes: { timeout: 2, http_503: 1 } }), m('12:00:00', { n: 2, ok: 2 })], now);
    expect(cells).toHaveLength(60);
    expect(cells[0]).toMatchObject({ time: '11:01', n: 4, avail: 1, state: 'avail', text: '11:01 · 4回 · 空き2日' });
    expect(cells[29]).toMatchObject({ time: '11:30', state: 'fail', text: '11:30 · 4回 · 失敗3（timeout・http_503） · 空き1日' });
    expect(cells[59]).toMatchObject({ time: '12:00', n: 2, state: 'ok' });
    expect(cells.filter((c) => c.state === 'none')).toHaveLength(57);
    expect(cells[1]).toMatchObject({ state: 'none', text: '11:02 · 確認なし' });
    expect(scanSummary(cells)).toBe('直近1時間：確認10回、失敗3回、空きあり2分');
    expect(scanTicks(cells)).toEqual([{ i: 14, label: '11:15' }, { i: 29, label: '11:30' }, { i: 44, label: '11:45' }, { i: 59, label: '12:00' }]);
    // the client reads it, a garbled minute or code left out
    const s = parseStatus({ ...example.status, recentMinutes: [...example.status.recentMinutes, { minute: 'x' }, { minute: 1, n: 1, codes: { 'bad code': 1, ok_code: 2 } }] })!;
    expect(s.recentMinutes).toEqual([...example.status.recentMinutes, { minute: 1, n: 1, ok: 0, fail: 0, avail: 0, codes: { ok_code: 2 } }]);
    const { recentMinutes: _m, ...without } = example.status;
    expect(parseStatus(without)!.recentMinutes).toEqual([]);
  });
  it('a failure without a code says only how many; the Tokyo minute holds whatever the phone’s zone (UTC minutes)', () => {
    const cells = minuteCells([{ minute: Date.parse('2026-11-13T02:59:00Z'), n: 1, ok: 0, fail: 1, avail: 0 }], Date.parse('2026-11-13T03:00:00Z'));
    expect(cells.at(-2)).toMatchObject({ time: '11:59', text: '11:59 · 1回 · 失敗1' });
    expect(cells.at(-1)).toMatchObject({ time: '12:00', state: 'none' });
    expect(minuteCells([], STATUS.now).every((c) => c.state === 'none')).toBe(true);
  });
});
