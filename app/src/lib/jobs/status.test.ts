// 定期処理's view (status.ts): a row's health by the phone's clock (遅れ past 2 cadences + 10 min, 止まっています past 4;
// a daily job a cadence + 2 h and two; an event-driven one never late), its last finished runs (one failure warn, two
// bad, a part warn; skipped ones pass), the page's verdict naming the rows (never-run rows aside; a look for a 不調
// row or an open alert), the strips (24 cells, the newest at the right) and the 14 days.
import { describe, expect, it } from 'vitest';
import { dayCells, rowHealth, runCells, runLine, verdictOf } from './status.ts';
import { parseJobs, type JobRow, type JobsStatus } from '#lib/contract/jobs.ts';

const MIN = 60_000, H = 60 * MIN, D = 24 * H;
const NOW = Date.parse('2026-11-24T03:20:00.000Z');
const row = (id: JobRow['id'], runs: JobRow['runs'], days: JobRow['days'] = []): JobRow => ({ id, runs, days });
const status = (jobs: JobRow[], alerts: JobsStatus['alerts'] = [], err: string | null = null): JobsStatus => ({ ok: true, v: 1, now: NOW, ext: { at: NOW, by: 'app', err }, jobs, alerts });

describe('a row’s health', () => {
  it('by its newest run’s age: a 30-min job late past 70 min, stopped past 130; a daily one past 26 h and 50 h; an event-driven one never', () => {
    expect(rowHealth(row('tick', [{ t: NOW - 69 * MIN, st: 'ok' }]), NOW)).toEqual({ tone: 'good', why: 'ok' });
    expect(rowHealth(row('tick', [{ t: NOW - 71 * MIN, st: 'ok' }]), NOW)).toEqual({ tone: 'warn', why: 'late' });
    expect(rowHealth(row('tick', [{ t: NOW - 131 * MIN, st: 'ok' }]), NOW)).toEqual({ tone: 'bad', why: 'stopped' });
    expect(rowHealth(row('backup', [{ t: NOW - 25 * H, st: 'ok' }]), NOW).why).toBe('ok');
    expect(rowHealth(row('backup', [{ t: NOW - 27 * H, st: 'ok' }]), NOW).why).toBe('late');
    expect(rowHealth(row('backup', [{ t: NOW - 51 * H, st: 'ok' }]), NOW).why).toBe('stopped');
    expect(rowHealth(row('pages', [{ t: NOW - 9 * D, st: 'ok' }]), NOW).why).toBe('ok');
  });

  it('by its last finished runs: one failure warn, two bad (idle and running ones pass), a part warn; none: unknown; only idle: idle', () => {
    expect(rowHealth(row('pages', [{ t: NOW, st: 'run' }, { t: NOW - H, st: 'fail' }, { t: NOW - 2 * H, st: 'ok' }]), NOW)).toEqual({ tone: 'warn', why: 'failed' });
    expect(rowHealth(row('pages', [{ t: NOW, st: 'fail' }, { t: NOW - H, st: 'idle' }, { t: NOW - 2 * H, st: 'fail' }]), NOW)).toEqual({ tone: 'bad', why: 'failing' });
    expect(rowHealth(row('gym', [{ t: NOW, st: 'warn' }]), NOW)).toEqual({ tone: 'warn', why: 'partial' });
    expect(rowHealth(row('pages', [{ t: NOW, st: 'run' }, { t: NOW - H, st: 'ok' }]), NOW)).toEqual({ tone: 'good', why: 'running' });
    expect(rowHealth(row('places', [{ t: NOW, st: 'idle' }]), NOW)).toEqual({ tone: 'idle', why: 'ok' });
  });

  it('none yet: its first scheduled run to come is 初回 (neutral, its time); past it as far as a late run, 遅れ; no schedule: 記録なし', () => {
    // (the relay began keeping at 11:00 Tokyo; nightly's first is 3:00 the next day)
    const since = Date.parse('2026-11-24T11:00+09:00');
    expect(rowHealth(row('nightly', []), NOW, since)).toEqual({ tone: 'idle', why: 'first', next: Date.parse('2026-11-25T03:00+09:00') });
    expect(rowHealth(row('nightly', []), Date.parse('2026-11-25T04:00+09:00'), since).why).toBe('first');
    expect(rowHealth(row('nightly', []), Date.parse('2026-11-25T05:01+09:00'), since)).toEqual({ tone: 'warn', why: 'late' });
    expect(rowHealth(row('nightly', []), Date.parse('2026-11-26T05:01+09:00'), since)).toEqual({ tone: 'bad', why: 'stopped' });
    // (a 30-min one: its next :15 or :45)
    expect(rowHealth(row('tick', []), NOW).next).toBe(Date.parse('2026-11-24T12:45+09:00'));
    expect(rowHealth(row('places', []), NOW)).toMatchObject({ tone: 'idle', why: 'first' });
    expect(rowHealth(row('pages', []), NOW)).toEqual({ tone: 'idle', why: 'none' });
  });

  it('the latest state only: a failure in the last day, a success since, is 回復 (good); older, 順調; cancelled runs pass', () => {
    expect(rowHealth(row('pages', [{ t: NOW - H, st: 'ok' }, { t: NOW - 2 * H, st: 'fail' }, { t: NOW - 3 * H, st: 'fail' }]), NOW)).toEqual({ tone: 'good', why: 'recovered' });
    expect(rowHealth(row('pages', [{ t: NOW - H, st: 'ok' }, { t: NOW - 25 * H, st: 'fail' }]), NOW)).toEqual({ tone: 'good', why: 'ok' });
    expect(rowHealth(row('pages', [{ t: NOW - H, st: 'idle', c: 'cancelled' }, { t: NOW - 2 * H, st: 'ok' }]), NOW)).toEqual({ tone: 'good', why: 'ok' });
    expect(runLine({ t: NOW - H, st: 'idle', c: 'cancelled', by: 'r' }, NOW)).toBe('11:20 · 取り消し · 連携');
  });
});

describe('the verdict', () => {
  it('all well: 順調 with the count (never-run rows aside); a late row 一部不調; a stopped one 不調 with 「!」, the rows named', () => {
    const ok = status([row('tick', [{ t: NOW, st: 'ok' }]), row('wx', [{ t: NOW, st: 'ok' }]), row('places', [])]);
    expect(verdictOf(ok, NOW)).toMatchObject({ tone: 'good', w: 'healthy', sentence: '2件すべて順調です。 場所の分類は初回の実行待ちです。', needsLook: false });
    const late = status([row('tick', [{ t: NOW - 80 * MIN, st: 'ok' }]), row('wx', [{ t: NOW, st: 'ok' }])]);
    expect(verdictOf(late, NOW)).toMatchObject({ tone: 'warn', w: 'trouble', sentence: '定期実行に遅れか失敗があります。', needsLook: false });
    const bad = status([row('tick', [{ t: NOW - 3 * H, st: 'ok' }]), row('backup', [{ t: NOW, st: 'fail' }, { t: NOW - D, st: 'fail' }]), row('wx', [{ t: NOW, st: 'fail' }])], [], 'gh_403');
    expect(verdictOf(bad, NOW)).toMatchObject({ tone: 'bad', w: 'failing', needsLook: true, bad: ['tick', 'backup'], warn: ['wx'] });
    expect(verdictOf(bad, NOW).sentence).toBe('定期実行・バックアップが止まっているか、失敗が続いています。 天気の取得に遅れか失敗があります。 GitHubを読み込めませんでした（gh_403）。');
  });

  it('an open alert issue needs a look even when every row is well', () => {
    expect(verdictOf(status([row('tick', [{ t: NOW, st: 'ok' }])], [{ n: 3, title: 'x', label: 'alert', at: NOW }]), NOW).needsLook).toBe(true);
  });

  it('fine now reads 順調: the recovered named, the first runs to come named, neither a warning', () => {
    const s = status([row('tick', [{ t: NOW, st: 'ok' }]), row('pages', [{ t: NOW - H, st: 'ok' }, { t: NOW - 2 * H, st: 'fail' }]), row('nightly', [])]);
    expect(verdictOf(s, NOW)).toMatchObject({ tone: 'good', w: 'healthy', needsLook: false, bad: [], warn: [], sentence: '2件すべて順調です。 デプロイは回復しました。 夜間処理は初回の実行待ちです。' });
  });
});

it('the strip: 24 cells, the newest at the right edge, the empty ones before; the days: 14 to today', () => {
  const cells = runCells(row('wx', [{ t: NOW, st: 'ok' }, { t: NOW - 30 * MIN, st: 'fail', c: 'timeout' }, { t: NOW - H, st: 'run' }]), NOW);
  expect(cells).toHaveLength(24);
  expect(cells.slice(-3).map((c) => c.state)).toEqual(['none', 'fail', 'ok']);
  expect(cells.at(-2)!.label).toContain('失敗（timeout）');
  expect(new Set(cells.map((c) => c.start)).size).toBe(24);
  const days = dayCells(row('wx', [], [['2026-11-23', 3, 0], ['2026-11-24', 2, 1], ['2026-11-11', 0, 4]]), NOW);
  expect(days).toHaveLength(14);
  expect(days.map((d) => d.state).slice(-3)).toEqual(['none', 'ok', 'warn']);
  expect(days[0].state).toBe('fail');
});

it('a payload read back: unknown jobs and bad runs dropped, the copy’s fields', () => {
  const s = parseJobs({ ok: true, v: 1, now: NOW, ext: { at: NOW, by: 'app', err: null }, alerts: [{ n: 1, title: 't', label: 'alert', at: NOW }, { n: 'x' }],
    jobs: [{ id: 'tick', runs: [{ t: NOW, st: 'ok' }, { t: 'x', st: 'ok' }, { t: NOW, st: 'nope' }], days: [['2026-11-24', 1, 0], ['bad']] }, { id: 'nope', runs: [] }] });
  expect(s?.jobs).toEqual([{ id: 'tick', runs: [{ t: NOW, st: 'ok' }], days: [['2026-11-24', 1, 0]] }]);
  expect(s?.alerts).toHaveLength(1);
  expect(parseJobs({ ok: true, v: 2 })).toBeNull();
});
