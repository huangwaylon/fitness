// 設定's 保養所ボット page's view (view.ts): the draft and its PUT body (Tokyo's day boundaries), the date notes, the
// facilities merged from the roster and the runner's names (normName, U+FA1A), ★ and 除外 never both, the verdict's
// tones, the poll's pace, the facts, the bookings that need a person and the recent events.
import { describe, expect, it } from 'vitest';
import example from '../../../../its/contract-example.json';
import { parseSettingsInput, type ItsStatus } from './contract.ts';
import { parseStatus } from './client.ts';
import type { RosterHotel } from './roster.ts';
import {
  addDate, bookingRows, controlLine, dateBounds, dateRows, draftOf, duration, eventLines, factRows, footLine, hotelNote, hotelRows, pollMs, removeDate,
  sameDraft, saveError, toInput, toggleSkip, toggleStar, verdictView, type Draft
} from './view.ts';

const jst = (s: string) => Date.parse(`${s}+09:00`);
/** 2026-11-13 12:00 JST. */
const NOW = jst('2026-11-13T12:00:00');
const TODAY = '2026-11-13';
const STATUS = parseStatus(example.status)!;
const status = (over: Partial<ItsStatus> = {}): ItsStatus => ({ ...STATUS, ...over });
const draft = (over: Partial<Draft> = {}): Draft => ({ ...draftOf(STATUS.settings), ...over });

describe('the draft', () => {
  it('is the settings’ editable part; the same when only the order of dates or skips or their spelling differs', () => {
    const d = draft();
    expect(d).toEqual({ intervalSec: 15, dates: ['2026-11-21', '2026-11-22'], guests: 2, skip: ['ゆふいん山水館', 'ブルーベリーヒル勝浦'], priority: ['NAGU'], autoConfirm: false });
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
    expect(body).toEqual(example.settingsInput);
    expect(parseSettingsInput(body, NOW)).toEqual({ ok: true, value: body });
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

describe('hotelRows', () => {
  const R = (name: string, region: 'kanto' | 'other', verified = true): RosterHotel => ({ name, region, kind: 'year', cutoff: 10, verified });
  const roster = [R('鳴子温泉　湯元　吉祥', 'other'), R('NAGU 勝浦', 'kanto'), R('リソルの森', 'kanto', false), R('ゆふいん山水館', 'other'), R('ホテル日航アリビラ', 'other')];

  it('merges the runner’s names into the roster by normName (U+FA1A, full-width spaces), the rest on top as new', () => {
    const d = draft({ skip: [], priority: [] });
    const { search, skipped } = hotelRows(d, ['鳴子温泉 湯元 吉祥', 'ＮＡＧＵ　勝浦', '新しいホテル'], null, roster);
    expect(skipped).toEqual([]);
    expect(search.map((r) => [r.name, r.fresh])).toEqual([
      ['新しいホテル', true], ['NAGU 勝浦', false], ['リソルの森', false], ['鳴子温泉　湯元　吉祥', false], ['ゆふいん山水館', false], ['ホテル日航アリビラ', false]
    ]);
    expect(search.every((r) => r.search && r.star === null)).toBe(true);
  });

  it('puts ★ first in priority order (a priority entry is a substring), and the skipped in 除外中', () => {
    const d = draft({ skip: ['ゆふいん 山水館', '消えた施設'], priority: ['アリビラ', 'nagu'] });
    const { search, skipped } = hotelRows(d, [], null, roster);
    expect(search.map((r) => [r.name, r.star])).toEqual([['ホテル日航アリビラ', 0], ['NAGU 勝浦', 1], ['リソルの森', null], ['鳴子温泉　湯元　吉祥', null]]);
    expect(skipped.map((r) => r.name)).toEqual(['ゆふいん山水館', '消えた施設']);
    // a priority entry naming nothing listed still shows (★, so it can be taken off)
    expect(hotelRows(draft({ skip: [], priority: ['どこか'] }), [], null, roster).search[0]).toMatchObject({ name: 'どこか', star: 0, roster: null });
  });

  it('notes the roster’s kind and cutoff, 名前未確認 and 新しい施設', () => {
    const { search } = hotelRows(draft({ skip: [], priority: [] }), ['新しいホテル'], null, roster);
    expect(search.map(hotelNote)).toEqual(['新しい施設', '通年 · 10日前まで', '通年 · 10日前まで · 名前未確認', '通年 · 10日前まで', '通年 · 10日前まで', '通年 · 10日前まで']);
  });

  it('keeps a saved skip or ★ listed after the draft lets it go (on no roster, never seen)', () => {
    const saved = { skip: ['消えた施設'], priority: ['どこか'] };
    const d = draft({ skip: [], priority: [] });
    expect(hotelRows(d, [], null, roster).search.map((r) => r.name)).not.toContain('消えた施設');
    const { search } = hotelRows(d, [], saved, roster);
    expect(search.filter((r) => r.roster === null).map((r) => [r.name, r.search, r.star])).toEqual([['消えた施設', true, null], ['どこか', true, null]]);
    // and 除外 again from there
    expect(hotelRows(toggleSkip(d, '消えた施設'), [], saved, roster).skipped.map((r) => r.name)).toEqual(['消えた施設']);
  });

  it('links an unverified roster name and a site name, one inside the other: a 除外 on one doesn’t cover the other', () => {
    const d = draft({ skip: ['リソルの森'], priority: [] });
    const { search, skipped } = hotelRows(d, ['リソルの森 グランヴォー スパヴィレッジ'], null, roster);
    const site = search.find((r) => r.fresh)!;
    expect([site.name, site.search, site.similar]).toEqual(['リソルの森 グランヴォー スパヴィレッジ', true, 'リソルの森']);
    expect(hotelNote(site)).toBe('新しい施設 · 似た名前「リソルの森」');
    expect(skipped.map((r) => [r.name, r.similar])).toEqual([['リソルの森', 'リソルの森 グランヴォー スパヴィレッジ']]);
    expect(hotelNote(skipped[0])).toBe('通年 · 10日前まで · 名前未確認 · 似た名前「リソルの森 グランヴォー スパヴィレッジ」');
    // a verified roster name isn't linked (its spelling is the site's)
    expect(hotelRows(d, ['NAGU 勝浦 別館'], null, roster).search.every((r) => r.similar === null)).toBe(true);
  });

  it('keeps ★ and 除外 apart: skipping drops the priority, ★ un-skips', () => {
    const d = draft({ skip: [], priority: ['NAGU'] });
    const skipped = toggleSkip(d, 'NAGU 勝浦');
    expect([skipped.skip, skipped.priority]).toEqual([['NAGU 勝浦'], []]);
    const starred = toggleStar(skipped, 'NAGU 勝浦');
    expect([starred.skip, starred.priority]).toEqual([[], ['NAGU 勝浦']]);
    expect(toggleStar(starred, 'ＮＡＧＵ 勝浦').priority).toEqual([]);
    expect(toggleSkip(toggleSkip(d, 'リソルの森'), 'リソルの森').skip).toEqual([]);
    // a site's name past MAX_NAME: ★ keeps its first MAX_NAME UTF-16 units (whole code points), which still names it
    const long = `${'𠮷'.repeat(30)}${'あ'.repeat(150)}`;
    const longStar = toggleStar(d, long);
    const entry = longStar.priority[1];
    expect(entry.length).toBeLessThanOrEqual(80);
    expect(entry).toBe(`${'𠮷'.repeat(30)}${'あ'.repeat(20)}`);
    expect(long.startsWith(entry)).toBe(true);
    expect(hotelRows(longStar, [long]).search.find((r) => r.name === long)?.star).toBe(1);
    expect(toggleStar(longStar, long).priority).toEqual(['NAGU']);
    const odd = toggleStar(d, `${'あ'.repeat(79)}𠮷${'い'.repeat(10)}`).priority[1];
    expect(odd).toBe('あ'.repeat(79));   // never half a surrogate pair
    // every draft it makes still passes the contract
    for (const x of [skipped, starred, longStar]) expect(parseSettingsInput(toInput(x, null, NOW), NOW).ok).toBe(true);
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
    expect(controlLine({ ...STATUS, control: undefined }, name, TODAY)).toBeNull();   // an older Worker
    expect(controlLine(STATUS, name, TODAY)).toBe('開始（ウェイ・12:20）');
  });
});

describe('factRows', () => {
  const today = '2026-11-13';
  it('reads the last report', () => {
    expect(Object.fromEntries(factRows(STATUS, today).map((f) => [f.id, f.value]))).toEqual({
      phase: '空室を確認中', uptime: '12:50から（20分）', report: '13:10', scan: '13:10（120回）', solves: '成功 2 · 失敗 0（前回 19秒）',
      error: 'calendar_get · timeout（13:01）', run: '#19283746'
    });
    expect(factRows(STATUS, today).find((f) => f.id === 'run')!.href).toBe('https://github.com/huangwaylon/fitness/actions/runs/19283746');
  });
  it('without a report, only 最終報告; a failed dispatch, failures and the unsynced are shown when there are any', () => {
    expect(factRows(status({ runner: null }), today)).toEqual([{ id: 'report', label: '最終報告', value: 'まだ' }]);
    const r = { ...STATUS.runner!, scanFailures: 3, lastOkAt: STATUS.runner!.lastScanAt! - 60_000, unsynced: 1, runUrl: 'https://evil.example/x' };
    const ids = factRows(status({ runner: r, dispatch: { at: STATUS.now, ok: false, status: 403 } }), today).map((f) => f.id);
    expect(ids).toEqual(['dispatch', 'phase', 'uptime', 'report', 'scan', 'ok', 'failures', 'solves', 'error', 'unsynced']);
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
    expect(bookingRows(STATUS, TODAY)).toEqual([{ key: '2026-11-22\nnagu勝浦', state: 'action', date: '2026-11-22', hotel: 'NAGU 勝浦', label: '要対応', detail: '日付が近いため、メールから申込してください' }]);
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
  });
});
