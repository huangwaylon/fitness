// The gym bot's status as 設定's ジムボット page reads it (status.ts): the payload checked, the verdict's tone and
// words, the fact rows and each check's line.
import { describe, expect, it, vi } from 'vitest';
import { checkLine, factRows, fetchStatus, needsAttention, parseStatus, verdictView, type Check, type GymStatus } from './status.ts';

const TODAY = '2026-11-04';
const at = (hm: string, day = TODAY) => Date.parse(`${day}T${hm}:00+09:00`);
const NOW = at('12:00');
const ok = { training: 'ok', pilates: 'ok' } as const;

/** A healthy runner on a 15-minute alarm, an older check's pilates timed out. */
function sample(now: number): GymStatus {
  const MIN = 60_000, last = now - 6 * MIN;
  const checks: Check[] = [
    { t: last, by: 'alarm', ms: 2900, r: ok, open: 1, fresh: 0, push: 'none' },
    { t: last - 9 * MIN, by: 'tap', ms: 3100, r: ok, open: 1, fresh: 1, push: 'held' },
    { t: last - 15 * MIN, by: 'alarm', ms: 15400, r: { training: 'ok', pilates: 'timeout' }, open: 0, fresh: 0, push: 'none' },
    { t: last - 31 * MIN, by: 'alarm', ms: 2700, r: ok, open: 0, fresh: 0, push: 'none' },
    { t: last - 46 * MIN, by: 'alarm', ms: 4, idle: true, open: 0, fresh: 0, push: 'none' }
  ];
  return {
    v: 1, now, mode: 'bot', sha: 'abc1234', verdict: 'healthy', reasons: [], intervalMin: 15, paused: false,
    nextCheck: last + 15 * MIN, lastCheck: last, lastOk: last, lastError: { t: last - 15 * MIN, code: 'timeout' },
    failures: 0, siteDownSent: false, retryPending: false, checks,
    line: { used: 23, limit: 200, webhookOk: true, asOf: now - 40 * MIN }
  };
}
const status = (over: Partial<GymStatus> = {}): GymStatus => ({ ...sample(NOW), ...over });

describe('needsAttention (ボット’s dot)', () => {
  it('is on for 不調, 要対応 and 遅れ only', () => {
    const on = (verdict: GymStatus['verdict']) => needsAttention(status({ verdict }));
    expect([on('failing'), on('broken'), on('late')]).toEqual([true, true, true]);
    expect([on('healthy'), on('degraded'), on('stopped'), on('off')]).toEqual([false, false, false, false]);
  });
});

describe('verdictView', () => {
  it('gives each verdict its tone, and the first reason its sentence', () => {
    expect(verdictView(status())).toEqual({ tone: 'good', word: '順調', sentence: '予定どおりチェックしています。' });
    expect(verdictView(status({ verdict: 'degraded', reasons: ['site_failing', 'quota_high'], failures: 2 }))).toEqual({
      tone: 'warn', word: '一部不調', sentence: '予約サイトのチェックが2回続けて失敗しています。'
    });
    expect(verdictView(status({ verdict: 'late', reasons: ['overdue'] })).tone).toBe('warn');
    expect(verdictView(status({ verdict: 'failing', reasons: ['site_failing'], failures: 4 })).tone).toBe('bad');
    expect(verdictView(status({ verdict: 'broken', reasons: ['webhook_wrong'] }))).toMatchObject({ tone: 'bad', word: '要対応' });
    expect(verdictView(status({ verdict: 'stopped', reasons: ['paused'] })).tone).toBe('idle');
    expect(verdictView(status({ verdict: 'off', reasons: ['mode_off', 'no_alarm'] }))).toMatchObject({ tone: 'idle', word: 'オフ', sentence: 'ボットがオフになっています。チェックも通知もしません。' });
  });
});

describe('factRows', () => {
  const ids = (s: GymStatus) => factRows(s, TODAY).map((r) => r.id);
  it('shows 最後の成功 only when it isn’t the last check, 連続失敗 only when there are any', () => {
    expect(ids(status())).toEqual(['last', 'next', 'line']);
    expect(ids(status({ lastOk: at('10:00'), failures: 2 }))).toEqual(['last', 'next', 'ok', 'failures', 'line']);
  });
  it('words the times and LINE’s count', () => {
    const rows = Object.fromEntries(factRows(status({ lastCheck: at('11:54'), nextCheck: at('12:09'), lastOk: null, failures: 3 }), TODAY).map((r) => [r.id, r.value]));
    expect(rows).toEqual({ last: '11:54', next: '12:09ごろ', ok: 'まだ', failures: '3回', line: '23 / 200' });
    const line = (l: Partial<GymStatus['line']>) => factRows(status({ line: { ...status().line, ...l } }), TODAY).at(-1)!.value;
    expect([line({ limit: null }), line({ used: null })]).toEqual(['23（上限なし）', '不明']);
    expect(factRows(status({ nextCheck: null }), TODAY)[1].value).toBe('なし');
  });
});

describe('checkLine', () => {
  const check = (over: Partial<Check> = {}): Check => ({ t: at('11:54'), by: 'alarm', ms: 3000, r: ok, open: 2, fresh: 0, push: 'none', ...over });
  it('a good check: time, 定時, ○ per program, the open count', () => {
    expect(checkLine(check(), TODAY)).toEqual({
      time: '11:54', by: '定時', idle: false, open: '空き 2', problems: [],
      marks: [{ id: 'training', name: 'トレーニング', ok: true }, { id: 'pilates', name: 'ピラティス', ok: true }]
    });
  });
  it('a check before midnight gets its date', () => {
    expect(checkLine(check({ t: at('23:50', '2026-11-03') }), TODAY).time).toBe('11月3日(火) 23:50');
  });
  it('a failed one names the program and the error in words, a failed push too', () => {
    const l = checkLine(check({ by: 'tap', r: { training: 'http_5xx', pilates: 'timeout' }, push: 'failed' }), TODAY);
    expect([l.by, l.marks.map((m) => m.ok)]).toEqual(['手動', [false, false]]);
    expect(l.problems).toEqual(['トレーニング：サイトのエラー', 'ピラティス：タイムアウト', 'LINEへの通知に失敗']);
  });
  it('an idle alarm has no marks', () => {
    expect(checkLine(check({ idle: true, r: undefined, open: 0 }), TODAY)).toMatchObject({ idle: true, marks: [], problems: [] });
  });
});

describe('parseStatus', () => {
  const wire = () => JSON.parse(JSON.stringify(sample(NOW))) as Record<string, unknown>;
  it('takes the Worker’s answer as it is', () => {
    expect(parseStatus(wire())).toEqual(sample(NOW));
  });
  it('refuses what isn’t one', () => {
    for (const x of [null, 'oops', [], {}, { ...wire(), v: 2 }, { ...wire(), verdict: 'great' }, { ...wire(), now: 'soon' }]) expect(parseStatus(x)).toBeNull();
  });
  it('leaves out a garbled check, an unknown reason and a bad field', () => {
    const s = parseStatus({ ...wire(), reasons: ['overdue', 'gremlins'], checks: [{ t: 1, by: 'alarm', r: { training: 'ok' } }, 'x', { t: 2, by: 'tap', r: ok, push: '?' }], nextCheck: 'later', line: null });
    expect(s).toMatchObject({ reasons: ['overdue'], nextCheck: null, line: { used: null, limit: null, webhookOk: null, asOf: null } });
    expect(s!.checks).toEqual([{ t: 2, by: 'tap', ms: 0, r: ok, open: 0, fresh: 0, push: 'none' }]);
  });
});

describe('fetchStatus', () => {
  it('reads /status, and throws on a failed request or garbage', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    vi.stubGlobal('fetch', fetch);
    fetch.mockResolvedValueOnce(new Response(JSON.stringify(sample(NOW))));
    expect(await fetchStatus(undefined, 'https://gym.test')).toEqual(sample(NOW));
    expect(fetch.mock.calls[0][0]).toBe('https://gym.test/status');
    fetch.mockResolvedValueOnce(new Response('boom', { status: 500 }));
    await expect(fetchStatus(undefined, 'https://gym.test')).rejects.toThrow('HTTP 500');
    fetch.mockResolvedValueOnce(new Response('{"hello":1}'));
    await expect(fetchStatus(undefined, 'https://gym.test')).rejects.toThrow('not a status');
    vi.unstubAllGlobals();
  });
});
