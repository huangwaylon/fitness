// The gym bot's status as ボット's ジム tab reads it (status.ts): the payload checked, the verdict's tone and
// words, the card's edges, the fact rows and the strip's cells.
import { describe, expect, it, vi } from 'vitest';
import { checkStrip, edges, factRows, fetchStatus, needsAttention, parseStatus, reasonLines, verdictView, type Check, type GymStatus } from './status.ts';

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
  it('is on only while a person must act: 故障, or 不調 for more than the site failing', () => {
    const on = (verdict: GymStatus['verdict'], reasons: GymStatus['reasons'] = []) => needsAttention(status({ verdict, reasons }));
    expect([on('broken'), on('broken', ['webhook_wrong']), on('failing', ['site_failing', 'push_retry'])]).toEqual([true, true, true]);
    // the site failing (the bot retries) and 遅れ (the hourly cron re-arms it) heal on their own
    expect([on('failing'), on('failing', ['site_failing']), on('late', ['overdue'])]).toEqual([false, false, false]);
    expect([on('healthy'), on('degraded'), on('stopped'), on('off')]).toEqual([false, false, false, false]);
  });
});

describe('verdictView', () => {
  it('gives each verdict its tone, and the first reason its sentence', () => {
    expect(verdictView(status())).toEqual({ tone: 'good', w: 'healthy', word: '順調', sentence: '' }); // the word says it
    expect(verdictView(status({ verdict: 'degraded', reasons: ['site_failing', 'quota_high'], failures: 2 }))).toEqual({
      tone: 'warn', w: 'trouble', word: '一部不調', sentence: '予約サイトの確認が2回続けて失敗しています。'
    });
    expect(verdictView(status({ verdict: 'late', reasons: ['overdue'] })).tone).toBe('warn');
    expect(verdictView(status({ verdict: 'failing', reasons: ['site_failing'], failures: 4 })).tone).toBe('bad');
    expect(verdictView(status({ verdict: 'broken', reasons: ['webhook_wrong'] }))).toMatchObject({ tone: 'bad', word: '故障' });
    expect(verdictView(status({ verdict: 'stopped', reasons: ['paused'] })).tone).toBe('idle');
    expect(verdictView(status({ verdict: 'off', reasons: ['mode_off', 'no_alarm'] }))).toMatchObject({ tone: 'idle', word: 'オフ', sentence: '確認も通知もしません。' });
  });

  it('without a reason, the sentence follows the verdict (never the word again)', () => {
    expect(verdictView(status({ verdict: 'failing', reasons: [], failures: 0 })).sentence).toBe('確認に失敗しています。');
    expect(verdictView(status({ verdict: 'failing', reasons: [], failures: 3 })).sentence).toBe('予約サイトの確認が3回続けて失敗しています。');
    expect(verdictView(status({ verdict: 'broken', reasons: [] })).sentence).toBe('確認に失敗しています。');
    expect(verdictView(status({ verdict: 'degraded', reasons: [] })).sentence).toBe('');
    expect(verdictView(status({ verdict: 'late', reasons: [] })).sentence).toBe('確認が予定より遅れています。');
    expect(verdictView(status({ verdict: 'stopped', reasons: [] }), true).sentence).toBe('⋯から再開できます。');
  });
});

describe('edges and factRows', () => {
  it('次回 the alarm (none while stopped or off) · いま空き when the last check saw a slot; 不調: 最後の成功', () => {
    expect(edges(status(), NOW)).toEqual({ next: '12:09ごろ', outcome: 'いま空き1枠' });
    const c = sample(NOW).checks;
    expect(edges(status({ checks: [{ ...c[0], open: 0 }] }), NOW).outcome).toBeNull();
    expect(edges(status({ checks: [c[4]] }), NOW).outcome).toBeNull(); // an alarm with no day: nothing seen
    expect(edges(status({ paused: true }), NOW).next).toBeNull();
    expect(edges(status({ mode: 'off' }), NOW).next).toBeNull();
    expect(edges(status({ verdict: 'failing', reasons: ['site_failing'], lastOk: at('10:00') }), NOW).outcome).toBe('最後の成功 10:00');
  });
  it('くわしく: 最後の成功 unless it’s the last check (or the card has it), 連続失敗 when any, LINE, the mode in words, the version', () => {
    const ids = (s: GymStatus) => factRows(s, NOW).map((r) => r.id);
    expect(ids(status())).toEqual(['line', 'mode', 'sha']);
    expect(ids(status({ lastOk: at('10:00'), failures: 2 }))).toEqual(['ok', 'failures', 'line', 'mode', 'sha']);
    expect(ids(status({ verdict: 'failing', lastOk: at('10:00'), failures: 2, sha: null }))).toEqual(['failures', 'line', 'mode']);
    const rows = Object.fromEntries(factRows(status({ lastOk: null, failures: 3 }), NOW).map((r) => [r.id, r.value]));
    expect(rows).toEqual({ ok: 'まだ', failures: '3回', line: '23 / 200', mode: 'ボット', sha: 'abc1234' });
    const line = (l: Partial<GymStatus['line']>) => factRows(status({ line: { ...status().line, ...l } }), NOW).find((r) => r.id === 'line')!.value;
    expect([line({ limit: null }), line({ used: null })]).toEqual(['23（上限なし）', '不明']);
  });
  it('確認が必要: the reasons after the first, then what to do', () => {
    expect(reasonLines(status({ verdict: 'degraded', reasons: ['program_failing'] }))).toEqual([]);
    expect(reasonLines(status({ verdict: 'degraded', reasons: ['site_failing', 'quota_high'], failures: 2 }))).toEqual([
      '今月のLINE送信数が上限に近づいています。', '間隔をあけて自動で再試行します。長く続くときは予約サイトの変更を疑ってください。', '月初まで、通知する日を減らすか間隔を長くしてください。'
    ]);
    expect(verdictView(status({ verdict: 'stopped', reasons: ['paused'] }), true).sentence).toBe('⋯から再開できます。');
    expect(verdictView(status({ verdict: 'stopped', reasons: ['paused'] })).sentence).toContain('LINE');
  });
});

describe('checkStrip (24 intervals)', () => {
  const MIN = 60_000;
  const check = (t: number, over: Partial<Check> = {}): Check => ({ t, by: 'alarm', ms: 3000, r: ok, open: 0, fresh: 0, push: 'none', ...over });
  /** Checks every `every` minutes (each a little early or late, as the alarm's ±15 %) back from 2 min ago, newest first. */
  const every = (n: number, gap = 15, jitter = [0, 2, -2, 1, -1]) =>
    Array.from({ length: n }, (_, i) => check(NOW - 2 * MIN - i * gap * MIN + jitter[i % jitter.length] * MIN));

  it('24 cells, one an interval (15 min: 6 hours), the newest last; jitter leaves no gap; ticks every 2 hours; 前回 the newest check', () => {
    const s = checkStrip(status({ checks: every(24) }));
    expect(s.cells).toHaveLength(24);
    expect(s.cells.every((c) => c.state === 'ok')).toBe(true);
    expect(s.cells.at(-1)!.end).toBe(NOW);
    expect(s.cells[0].start).toBe(NOW - 6 * 60 * MIN);
    expect(s.ticks.map((k) => k.label)).toEqual(['06:00', '08:00', '10:00']);
    expect(s.last).toEqual({ i: 23, label: '11:58' });
    expect(s.summary).toBe('直近6時間：確認24回、失敗0回、空き検出0回');
    expect(s.empty).toBeNull();
    expect(checkStrip(status({ intervalMin: 10, checks: every(2) })).summary).toMatch(/^直近4時間/);
    expect(checkStrip(status({ intervalMin: 0, checks: [] })).cells).toHaveLength(24); // (an older Worker: 15)
    // never checked: a line in its place
    expect(checkStrip(status({ checks: [] }))).toMatchObject({ last: null, empty: { text: 'まだ確認していません' } });
  });

  it('fail when both programs failed, warn when one did, avail when a slot was open, none when nothing was checked; each names its check', () => {
    const checks = every(12);
    checks[0] = check(checks[0].t, { open: 2 });
    checks[1] = check(checks[1].t, { r: { training: 'ok', pilates: 'timeout' }, push: 'failed' });
    checks[2] = check(checks[2].t, { idle: true, r: undefined });
    checks[3] = check(checks[3].t, { r: { training: 'http_5xx', pilates: 'timeout' } });
    const { cells, summary, last } = checkStrip(status({ checks }));
    expect(cells.slice(-5).map((c) => c.state)).toEqual(['ok', 'fail', 'none', 'warn', 'avail']);
    expect(cells.at(-1)!.label).toBe('11:58 · トレーニング○ ピラティス○ · 空き2');
    expect(cells.at(-2)!.label).toBe('11:45 · トレーニング○ ピラティス✕（タイムアウト） · LINEへの通知に失敗');
    expect(cells.at(-3)!.label).toBe('11:26 · 確認する日なし');
    // before the 12 kept: nothing checked, said with the cell's own time
    expect(cells.slice(0, 12).every((c) => c.state === 'none')).toBe(true);
    expect(cells[0].label).toBe('06:00 · 確認なし');
    expect(summary).toBe('直近6時間：確認11回、失敗2回、空き検出1回');
    expect(last).toEqual({ i: 23, label: '11:58' });
  });

  it('a 🔎 tap beside an alarm shares its cell; a gap of n intervals (stopped, backing off) leaves n − 1 empty', () => {
    const checks = [check(NOW - 2 * MIN, { by: 'tap', open: 1 }), check(NOW - 5 * MIN), check(NOW - 50 * MIN), check(NOW - 65 * MIN)];
    const { cells } = checkStrip(status({ checks }));
    expect(cells.slice(-5).map((c) => c.state)).toEqual(['ok', 'ok', 'none', 'none', 'avail']);
    expect(cells.at(-1)!.label).toBe('11:55 · トレーニング○ ピラティス○ / 11:58 手動 · トレーニング○ ピラティス○ · 空き1');
  });

  it('the newest stays in the last cell until the next is half an interval late', () => {
    expect(checkStrip(status({ checks: [check(NOW - 22 * MIN)] })).cells.at(-1)!.state).toBe('ok');
    expect(checkStrip(status({ checks: [check(NOW - 23 * MIN)] })).cells.slice(-2).map((c) => c.state)).toEqual(['ok', 'none']);
  });

  it('ticks every 2 hours, Tokyo', () => {
    const { cells, ticks } = checkStrip(status({ checks: [] }));
    expect(ticks.map((k) => k.label)).toEqual(['06:00', '08:00', '10:00']);
    expect(ticks.map((k) => cells[k.i].start <= at(k.label) && at(k.label) < cells[k.i].end)).toEqual([true, true, true]);
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
  it('reads /status (no header of ours: no preflight); a failed request or garbage is why not, never a throw', async () => {
    const fetch = vi.fn<typeof globalThis.fetch>();
    vi.stubGlobal('fetch', fetch);
    fetch.mockResolvedValueOnce(new Response(JSON.stringify(sample(NOW))));
    expect(await fetchStatus(undefined, 'https://gym.test')).toEqual({ ok: true, status: sample(NOW) });
    expect(fetch.mock.calls[0]).toEqual(['https://gym.test/status', { signal: undefined }]);
    fetch.mockResolvedValueOnce(new Response('boom', { status: 500 }));
    expect(await fetchStatus(undefined, 'https://gym.test')).toEqual({ ok: false, err: 'http', http: 500 });
    fetch.mockResolvedValueOnce(new Response('{"hello":1}'));
    expect(await fetchStatus(undefined, 'https://gym.test')).toEqual({ ok: false, err: 'json', http: 200 });
    fetch.mockRejectedValueOnce(new TypeError('Load failed'));
    expect(await fetchStatus(undefined, 'https://gym.test')).toEqual({ ok: false, err: 'offline', http: null });
    vi.unstubAllGlobals();
  });
});

describe('the driver (lib/gym/bot.ts)', () => {
  it('its verdict: needsAttention’s 「!」, the one word table (故障 for broken), polled every minute', async () => {
    const { driver } = await import('./bot.ts');
    const all: GymStatus['verdict'][] = ['healthy', 'degraded', 'failing', 'late', 'broken', 'stopped', 'off'];
    for (const v of all) expect(driver.verdict(status({ verdict: v }), NOW).needsLook, v).toBe(needsAttention(status({ verdict: v })));
    expect(all.map((v) => [driver.verdict(status({ verdict: v }), NOW).tone, driver.verdict(status({ verdict: v }), NOW).word])).toEqual([
      ['good', '順調'], ['warn', '一部不調'], ['bad', '不調'], ['warn', '遅れ'], ['bad', '故障'], ['idle', '停止中'], ['idle', 'オフ']
    ]);
    expect(driver.parse(sample(NOW))).toEqual(sample(NOW));
    expect(driver.pollMs(null)).toBe(60_000);
  });
});
