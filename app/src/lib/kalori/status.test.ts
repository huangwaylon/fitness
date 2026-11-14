// The Kalori scraper's status as ボット's メニュー tab reads it (status.ts): the file checked (unknown fields and codes
// tolerated), every verdict's words in Japanese and English, 遅れ by the phone's clock, the dot, the facts, the alert
// card, 直近8週's cells and the latest update's bar.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { REASONS, alertCard, changeParts, factRows, fetchStatus, keyRow, needsAttention, parseStatus, reasonText, runLink, verdictOf, verdictView, weekStrip, type KaloriStatus } from './status.ts';
import { loadEnglish, setLocale } from '#lib/i18n/index.ts';

const at = (s: string) => Date.parse(`${s}+09:00`);
const DAY = 86_400_000, WEEK = 7 * DAY;
const NOW = at('2026-11-14T12:03:00');
/** Wednesday's run, last week's and next. */
const LAST = at('2026-11-11T02:41:00'), NEXT = at('2026-11-18T02:41:00');

function sample(over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    v: 1, at: NOW, verdict: 'healthy', reasons: [],
    run: { id: 123456, url: 'https://github.com/huangwaylon/fitness/actions/runs/123456', event: 'schedule', round: 2, result: 'published', startedAt: LAST, endedAt: LAST + (4 * 60 + 12) * 60_000, shardsDone: 20, shardsTotal: 20 },
    next: NEXT,
    dataset: { tag: 'kalori-2026-11-11', date: '2026-11-11', url: 'https://github.com/huangwaylon/fitness/releases/tag/kalori-2026-11-11', items: 54269, shops: 448, ended: 1200 },
    diff: { added: 12, gone: 0, renamed: 1, valuesChanged: 38, estChanged: 4, endedChanged: 3, itemsDelta: 12, shares: { added: 0.0002, gone: 0, valuesChanged: 0.0007, estChanged: 0.0001 }, limits: { added: 0.02, gone: 0.015, valuesChanged: 0.05, estChanged: 0.05 } },
    coverage: { complete: true, fetched: 54269, discovered: 54269, shopsTracked: 448, noNutrition: 30, failed: 0 },
    merge: { sha: 'abc1234', deploy: 'ok', pr: null },
    alert: null,
    history: Array.from({ length: 8 }, (_, i) => ({ t: LAST - (7 - i) * WEEK + 60_000, result: 'merged', tag: 'kalori-x', added: 12, gone: 0, valuesChanged: 38, endedChanged: 3, ms: (4 * 60 + 12) * 60_000, runUrl: 'u' })),
    ...over
  };
}
const status = (over: Record<string, unknown> = {}): KaloriStatus => parseStatus(sample(over), NOW)!;

afterEach(() => setLocale('ja'));

describe('parseStatus', () => {
  it('reads the file, tolerating unknown fields and codes, and a part missing', () => {
    const s = parseStatus({ ...sample({ reasons: ['drift', 'new_code', 'drift'], extra: { x: 1 } }), dataset: undefined, merge: 'odd' })!;
    expect(s.reasons).toEqual(['drift']);
    expect([s.dataset, s.merge]).toEqual([null, null]);
    expect(s.run?.round).toBe(2);
    expect(s.history).toHaveLength(8);
  });
  it('needs v 1, at and a known verdict', () => {
    expect(parseStatus(sample({ v: 2 }))).toBeNull();
    expect(parseStatus(sample({ at: 'x' }))).toBeNull();
    expect(parseStatus(sample({ verdict: 'great' }))).toBeNull();
    expect(parseStatus('<html>')).toBeNull();
  });
  it('reads the alert without an issue (none is made), its links optional', () => {
    expect(status({ alert: { text: 'x', since: NOW, issueUrl: null } }).alert).toEqual({ text: 'x', since: NOW, runUrl: null, prUrl: null });
    expect(status({ alert: { text: '', since: NOW } }).alert).toBeNull();
  });
  it('keeps the newest 12 weeks', () => {
    const history = Array.from({ length: 15 }, (_, i) => ({ t: LAST + i, result: 'merged' }));
    expect(status({ history }).history.map((w) => w.t - LAST)).toEqual([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
  });
});

describe('parseStatus: what the file can’t make the page do', () => {
  it('rejects times out of range: a 1e300 or negative `next` is none (the strip still placed, at once)', () => {
    for (const next of [1e300, -1e300, -5, 0]) {
      const s = status({ next });
      expect(s.next).toBeNull();
      const t0 = performance.now();
      expect(weekStrip(s, NOW).cells).toHaveLength(8);
      expect(performance.now() - t0).toBeLessThan(50);
    }
    expect(parseStatus(sample({ at: 1e300 }), NOW)).toBeNull();
    expect(parseStatus(sample({ at: Date.UTC(2019, 0, 1) }), NOW)).toBeNull();
    expect(status({ run: { ...(sample().run as object), startedAt: NOW + 500 * DAY } }).run).toBeNull();
    expect(status({ run: { ...(sample().run as object), endedAt: -1 } }).run?.endedAt).toBeNull();
    expect(status({ history: [{ t: 1e300, result: 'merged' }, { t: LAST, result: 'held' }] }).history.map((w) => w.result)).toEqual(['held']);
    expect(status({ alert: { text: 'x', since: NOW + 401 * DAY } }).alert?.since).toBeNull();
    expect(status({ next: NOW + 399 * DAY }).next).toBe(NOW + 399 * DAY);
  });
  it('keeps only the repo’s links (no javascript:, no other host, nothing over-long) and caps texts', () => {
    const bad = ['javascript:alert(1)', 'https://evil.example/huangwaylon/fitness/', 'https://github.com/someone/fitness/pull/1', `https://github.com/huangwaylon/fitness/${'a'.repeat(400)}`, 'https://github.com/huangwaylon/fitness/x"onclick=1'];
    for (const u of bad) {
      const s = status({ run: { ...(sample().run as object), url: u }, merge: { pr: u }, alert: { text: 'x', since: NOW, runUrl: u, prUrl: u }, dataset: { ...(sample().dataset as object), url: u }, history: [{ t: LAST, result: 'merged', runUrl: u }] });
      expect([s.run?.url, s.merge?.pr, s.alert?.runUrl, s.alert?.prUrl, s.dataset?.url, s.history[0].runUrl], u).toEqual([null, null, null, null, null, null]);
      expect(factRows(s, NOW).filter((f) => f.href)).toEqual([]);
      expect(alertCard({ ...s, verdict: 'held' }, NOW)).toMatchObject({ pr: null });
      expect(runLink({ ...s, verdict: 'failing' }, NOW)).toBeNull();
    }
    expect(status({ dataset: { tag: 'k'.repeat(81) } }).dataset).toBeNull();
    expect(status({ alert: { text: 'x'.repeat(301), since: NOW } }).alert).toBeNull();
    expect(status({ dataset: { tag: 'kalori-x', date: '<b>' } }).dataset?.date).toBeNull();
  });
});

describe('verdictView', () => {
  it('gives each verdict its tone, word and sentence (ja)', () => {
    const v = (over: Record<string, unknown>) => { const x = verdictView(status(over), NOW); return [x.tone, x.word, x.sentence]; };
    expect(v({})).toEqual(['good', '順調', '11/11（水）に更新しました。']);
    expect(v({ verdict: 'running', run: { ...(sample().run as object), result: 'running', round: 3, shardsDone: 7, endedAt: null, startedAt: NOW - 3600_000 } }))
      .toEqual(['busy', '取得中', '3回目 · 20区画中7完了']);
    expect(v({ verdict: 'held', reasons: ['band_gone'], diff: { ...(sample().diff as object), tripped: [{ code: 'band_gone', key: 'gone', share: 0.021, limit: 0.015 }] } }))
      .toEqual(['warn', '保留', '変更が多すぎるため反映を止めました（削除 2.1%・上限1.5%）。アプリは11/11（水）のデータのままです。']);
    // only the gates that tripped, never a band within its limit; a file from before `tripped`: the words alone
    expect(v({ verdict: 'held', reasons: ['band_values'], diff: { ...(sample().diff as object), tripped: [{ code: 'band_values', key: 'renamed', share: 0.012, limit: 0.01 }] } })[2])
      .toBe('変更が多すぎるため反映を止めました（名前の変更 1.2%・上限1.0%）。アプリは11/11（水）のデータのままです。');
    expect(v({ verdict: 'held', reasons: ['band_gone'] })[2]).toBe('変更が多すぎるため反映を止めました（削除）。アプリは11/11（水）のデータのままです。');
    expect(v({ verdict: 'held', reasons: ['band_gone'], diff: { ...(sample().diff as object), tripped: [{ code: 'band_gone', key: 'gone', share: null, limit: 0.015 }] } })[2])
      .toBe('変更が多すぎるため反映を止めました（削除）。アプリは11/11（水）のデータのままです。');
    expect(v({ verdict: 'held', reasons: ['tests'] })[2]).toBe('テストが失敗しました。');
    expect(v({ verdict: 'held', reasons: ['band_items'] })[2]).toBe('いつもと違う変化があったため反映を止めました（品目数）。アプリは11/11（水）のデータのままです。');
    expect(v({ verdict: 'held', reasons: ['main_moved'] })).toEqual(['warn', '保留', '同時に他の変更があったため保留しました。']);
    expect(v({ verdict: 'late' })).toEqual(['warn', '遅れ', '11/18（水）2:41の実行がまだ始まっていません。']);
    expect(v({ verdict: 'failing', reasons: ['limits'] })).toEqual(['bad', '不調', '2回のラウンドでもアクセス制限が続きます。']);
    expect(v({ verdict: 'none', run: null, dataset: null, history: [] })).toEqual(['idle', 'まだありません', '最初の更新は11/18（水）2:41です。']);
  });
  it('says each in English', async () => {
    setLocale('en');
    await loadEnglish();
    const say = (over: Record<string, unknown>) => verdictView(status(over), NOW);
    expect(say({})).toMatchObject({ word: 'Healthy', sentence: 'Updated Wed 11/11.' });
    expect(say({ verdict: 'running', run: { ...(sample().run as object), round: 1, shardsDone: 4, startedAt: NOW } })).toMatchObject({ word: 'Fetching', sentence: 'Round 1 · 4 of 20 shards done' });
    expect(say({ verdict: 'held', reasons: ['band_gone'], diff: { ...(sample().diff as object), tripped: [{ code: 'band_gone', key: 'gone', share: 0.021, limit: 0.015 }] } }))
      .toMatchObject({ word: 'Held', sentence: "Too many changes, not applied (Removed 2.1%, limit 1.5%). The app keeps Wed 11/11's data." });
    expect(say({ verdict: 'late' })).toMatchObject({ word: 'Late', sentence: "The Wed 11/18 2:41 run hasn't started yet." });
    expect(say({ verdict: 'failing', reasons: ['drift'] })).toMatchObject({ word: 'Failing', sentence: "The site changed; pages don't parse." });
    expect(say({ verdict: 'none' })).toMatchObject({ word: 'No data yet', sentence: 'The first update is Wed 11/18 2:41.' });
  });
});

describe('every reason in words', () => {
  it('has a sentence (or a band’s line) in both languages', async () => {
    const s = status();
    const ja = REASONS.map((r) => reasonText(s, r));
    expect(ja.filter((x) => x.startsWith('kalori.'))).toEqual([]);
    expect(reasonText(s, 'drift')).toBe('サイトの構成が変わり読み取れません。');
    expect(reasonText(s, 'reverted')).toBe('テストが失敗したため元に戻しました。');
    expect(reasonText(s, 'band_values')).toBe('値の変更');
    expect(reasonText(status({ diff: { ...(sample().diff as object), tripped: [{ code: 'band_values', key: 'values', share: 0.02, limit: 0.01 }] } }), 'band_values')).toBe('値の変更 2.0%・上限1.0%');
    expect(reasonText(s, 'band_shops')).toBe('店舗数');
    setLocale('en');
    await loadEnglish();
    const en = REASONS.map((r) => reasonText(s, r));
    expect(en.filter((x) => x.startsWith('kalori.') || /[ぁ-んァ-ン一-龥]/.test(x))).toEqual([]);
    expect(reasonText(s, 'nonut')).toBe('Items without nutrition jumped.');
  });
});

describe('遅れ by the phone’s clock', () => {
  it('a day past the scheduled run with no newer one, even when the file says 順調', () => {
    const s = status({ next: LAST, run: { ...(sample().run as object), startedAt: LAST - WEEK, endedAt: LAST - WEEK + 3600_000 } });
    expect(verdictOf(s, LAST + DAY - 1)).toBe('healthy');
    expect(verdictOf(s, LAST + DAY + 1)).toBe('late');
    expect(verdictView(s, LAST + DAY + 1).sentence).toBe('11/11（水）2:41の実行がまだ始まっていません。');
  });
  it('not once a run started since, nor over 保留 or 不調', () => {
    const late = NEXT + 2 * DAY;
    expect(verdictOf(status({ run: { ...(sample().run as object), startedAt: NEXT + 60_000 } }), late)).toBe('healthy');
    expect(verdictOf(status({ verdict: 'failing' }), late)).toBe('failing');
    expect(verdictOf(status({ verdict: 'held' }), late)).toBe('held');
    expect(verdictOf(status({ verdict: 'none', run: null }), late)).toBe('late');
  });
});

describe('needsAttention (ボット’s dot)', () => {
  it('is on for 保留, 不調, 遅れ and a standing alert only', () => {
    const on = (over: Record<string, unknown>, now = NOW) => needsAttention(status(over), now);
    expect([on({ verdict: 'held' }), on({ verdict: 'failing' }), on({ verdict: 'late' }), on({ alert: { text: 'x', since: NOW } })]).toEqual([true, true, true, true]);
    expect([on({}), on({ verdict: 'running' }), on({ verdict: 'none' })]).toEqual([false, false, false]);
    expect(on({}, NEXT + DAY + 1)).toBe(true);
  });
});

describe('keyRow and factRows', () => {
  const keys = (s: KaloriStatus, now = NOW) => Object.fromEntries(keyRow(s, now).map((k) => [k.id, [k.value, k.sub ?? null]]));
  it('前回 (the newest run kept and what came of it) · 次回 · 品目; 不調: 最後の成功', () => {
    expect(keys(status())).toEqual({ last: ['11/11（水）2:42', '公開'], next: ['11/18（水）2:41ごろ', null], items: ['54,269品', '448店'] });
    // a run under way doesn't count yet; the deploy's failure or revert is what came of the merge
    expect(keys(status({ verdict: 'running' })).last).toEqual(['11/11（水）2:42', '公開']);
    expect(keys(status({ merge: { sha: 'a', deploy: 'reverted', pr: null } })).last[1]).toBe('元に戻しました');
    expect(keys(status({ merge: { sha: 'a', deploy: 'failed', pr: null } })).last[1]).toBe('デプロイ失敗');
    const h = sample().history as Record<string, unknown>[];
    expect(keys(status({ verdict: 'held', history: [...h.slice(0, -1), { ...h.at(-1), result: 'held' }] })).last[1]).toBe('保留');
    expect(keys(status({ verdict: 'failing', history: [...h.slice(0, -1), { ...h.at(-1), result: 'failed' }] })).ok).toEqual(['11/4（水）2:42', null]);
    expect(keys(status({ verdict: 'none', history: [], dataset: null }))).toEqual({ last: ['まだ', null], next: ['11/18（水）2:41ごろ', null] });
  });
  it('くわしく: データ, 網羅, 実行 (unless the verdict opens it), 所要時間, ラウンド, 変更率 and PR (unless 保留 says them), デプロイ, the workflow', () => {
    const f = factRows(status({ merge: { sha: null, deploy: 'pending', pr: 'https://github.com/huangwaylon/fitness/pull/812' } }), NOW);
    expect(f.map((r) => [r.id, r.value])).toEqual([
      ['data', 'kalori-2026-11-11'],
      ['coverage', '完了'],
      ['run', '#123456'],
      ['took', '4時間12分'],
      ['rounds', '2回'],
      ['rate', '追加 0.0%・上限2.0%、削除 0.0%・上限1.5%、値の変更 0.1%・上限5.0%、推定値の変更 0.0%・上限5.0%'],
      ['pr', '#812'],
      ['deploy', '待機中'],
      ['workflow', 'kalori-scrape.yml']
    ]);
    expect(f.find((r) => r.id === 'data')?.href).toContain('/releases/tag/kalori-2026-11-11');
    expect(f.find((r) => r.id === 'run')?.href).toContain('/actions/runs/123456');
    const held = factRows(status({ verdict: 'held', merge: { sha: null, deploy: 'held', pr: 'https://github.com/huangwaylon/fitness/pull/812' } }), NOW).map((r) => r.id);
    expect(held).toEqual(['data', 'coverage', 'took', 'rounds', 'deploy', 'workflow']);
  });
  it('coverage in counts while incomplete; only what the file has', () => {
    const f = factRows(status({ coverage: { complete: false, fetched: 30000, discovered: 54000, failed: 12 }, run: null, dataset: null, diff: null, merge: null }), NOW);
    expect(f.map((r) => [r.id, r.value])).toEqual([['coverage', '30,000 / 54,000品 · 失敗12'], ['workflow', 'kalori-scrape.yml']]);
  });
});

describe('alertCard and runLink', () => {
  it('only what the sentence leaves out: 保留’s PR to merge by hand, the other reasons, an alert no reason words; the run: the verdict’s action', () => {
    const pr = 'https://github.com/huangwaylon/fitness/pull/9';
    expect(alertCard(status({ verdict: 'failing', reasons: ['crash', 'publish'], merge: { pr } }), NOW)).toEqual({ lines: ['公開に失敗しました。'], pr: null });
    expect(alertCard(status({ verdict: 'failing', reasons: ['crash'] }), NOW)).toBeNull();
    expect(alertCard(status({ verdict: 'held', reasons: ['band_gone'], merge: { pr } }), NOW)).toEqual({ lines: ['PRを確認して、問題なければ手動でマージしてください。'], pr });
    expect(alertCard(status({ verdict: 'held', reasons: ['band_gone', 'tests'], merge: { pr } }), NOW)!.lines).toEqual(['PRを確認して、問題なければ手動でマージしてください。', 'テストが失敗しました。']);
    const [r, p] = ['https://github.com/huangwaylon/fitness/actions/runs/7', 'https://github.com/huangwaylon/fitness/pull/8'];
    expect(alertCard(status({ alert: { text: 'ひと言', since: NOW, runUrl: r, prUrl: p } }), NOW)).toEqual({ lines: ['ひと言'], pr: null });
    expect(alertCard(status(), NOW)).toBeNull();
    expect(alertCard(status({ verdict: 'running' }), NOW)).toBeNull();
    expect(runLink(status({ verdict: 'failing' }), NOW)).toBe('https://github.com/huangwaylon/fitness/actions/runs/123456');
    expect(runLink(status({ verdict: 'running' }), NOW)).toContain('/runs/123456');
    expect(runLink(status(), NOW)).toBeNull();
  });
});

describe('weekStrip (直近8週)', () => {
  it('a cell a week, the newest holding now; 公開 · 保留 · 失敗 · none', () => {
    const h = sample().history as Record<string, unknown>[];
    h[5] = { ...h[5], result: 'held' };
    h[6] = { ...h[6], result: 'failed' };
    h.splice(2, 1);
    const { cells, ticks, summary, line } = weekStrip(status({ history: h }), NOW);
    expect(cells.map((c) => c.state)).toEqual(['ok', 'ok', 'none', 'ok', 'ok', 'warn', 'fail', 'ok']);
    expect(cells.at(-1)!.start).toBeLessThanOrEqual(NOW);
    expect(cells.at(-1)!.end).toBeGreaterThan(NOW);
    expect(cells.at(-1)!.label).toBe('11/11（水）· 公開 · 追加12 値38 終了3 · 4時間12分');
    expect(cells[2].label).toBe('10/7（水）· 実行なし');
    expect(ticks.map((t) => t.i)).toEqual([1, 3, 5, 7]);
    expect(ticks.at(-1)!.label).toBe('11/11');
    expect(summary).toBe('直近8週：公開5回、保留1回、失敗1回');
    expect(line).toBe('公開5 · 保留1 · 失敗1');
  });
  it('the newest run of a week decides it (a failure then a retry merged)', () => {
    const h = [{ t: LAST, result: 'failed' }, { t: LAST + 3 * 3600_000, result: 'merged' }];
    expect(weekStrip(status({ history: h }), NOW).cells.at(-1)!.state).toBe('ok');
  });
  it('steps past a missed run: the week holding now is empty', () => {
    const { cells } = weekStrip(status(), NEXT + 2 * DAY);
    expect(cells.at(-1)!.state).toBe('none');
    expect(cells.at(-2)!.state).toBe('ok');
  });
});

describe('the bar', () => {
  it('追加 · 値の変更 · 終了 · 削除, one line for VoiceOver', () => {
    const { parts, summary } = changeParts(status().diff!);
    expect(parts.map((p) => [p.id, p.tone, p.n])).toEqual([['added', 'leaf', 12], ['valuesChanged', 'yuzu', 38], ['endedChanged', 'hatch', 3], ['gone', 'sunk', 0]]);
    expect(summary).toBe('前回の変更：追加12、値の変更38、終了3、削除0');
  });
});

describe('fetchStatus', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('reads the file past the cache; a failure is offline, http or json', async () => {
    const fetch = vi.fn(async () => new Response(JSON.stringify(sample()), { status: 200 }));
    vi.stubGlobal('fetch', fetch);
    const r = await fetchStatus(undefined, 'https://x/status.json');
    expect(r.ok && r.status.verdict).toBe('healthy');
    expect(fetch).toHaveBeenCalledWith('https://x/status.json', expect.objectContaining({ cache: 'no-cache' }));
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 404 })));
    expect(await fetchStatus()).toEqual({ ok: false, err: 'http', http: 404 });
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"v":2}', { status: 200 })));
    expect(await fetchStatus()).toEqual({ ok: false, err: 'json', http: 200 });
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Load failed'); }));
    expect(await fetchStatus()).toEqual({ ok: false, err: 'offline', http: null });
  });
});

describe('the driver (lib/kalori/bot.ts)', () => {
  it('its verdict: needsAttention’s 「!」 (an alert, two days overdue), 遅れ by the clock, 取得中 busy', async () => {
    const { driver } = await import('./bot.ts');
    const cases: [Record<string, unknown>, number][] = [
      [{}, NOW], [{ verdict: 'held' }, NOW], [{ verdict: 'failing' }, NOW], [{ verdict: 'late' }, NOW], [{ alert: { text: 'x', since: NOW } }, NOW],
      [{ verdict: 'running' }, NOW], [{ verdict: 'none' }, NOW], [{}, NEXT + DAY + 1], [{}, NEXT + 2 * DAY + 1]
    ];
    for (const [over, now] of cases) expect(driver.verdict(status(over), now).needsLook, JSON.stringify(over)).toBe(needsAttention(status(over), now));
    expect(driver.verdict(status(), NEXT + DAY + 1)).toMatchObject({ tone: 'warn', w: 'late', word: '遅れ', needsLook: true });
    expect(driver.verdict(status({ verdict: 'running' }), NOW)).toMatchObject({ tone: 'busy', word: '取得中', needsLook: false });
    expect(driver.verdict(status({ alert: { text: 'x', since: NOW } }), NOW)).toMatchObject({ tone: 'good', needsLook: true });
    expect(driver.pollMs(null)).toBe(60_000);
  });
});
