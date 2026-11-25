// Jobs' view (status.ts), English whatever the app's language (the page is English only): a row's health by the
// phone's clock (late past 2 cadences + 10 min, stopped past 4; a daily job a cadence + 2 h and two; an event-driven
// one never late), its last finished runs (one failure warn, two bad, a part warn; skipped ones pass), the layout
// (Needs you from anywhere: the bots and the limits too; the folds' summaries; the rows waiting on another), the
// verdict's sentence of what to do (the bots counted, the flake hunt and the recovered not), the strips and the days.
import { describe, expect, it } from 'vitest';
import { agoOf, compactNum, dayCells, extraRows, factRows, lastRun, layout, menuDetail, parseView, rowHealth, runCells, runLine, stepsOf, usageTone, usageView, verdictOf, whyOf, type JobsView, type SvcIn } from './status.ts';
import type { BotVerdict } from '#lib/bots/types.ts';
import { i18n, loadEnglish } from '#lib/i18n/index.ts';
import { FREE_LIMITS, JOBS, parseJobs, type JobRow, type JobsStatus, type Usage, type UsageKey } from '#lib/contract/jobs.ts';
import { parseStatus, type KaloriStatus } from '#lib/kalori/status.ts';

const MIN = 60_000, H = 60 * MIN, D = 24 * H;
const NOW = Date.parse('2026-11-24T03:20:00.000Z');
const row = (id: JobRow['id'], runs: JobRow['runs'], days: JobRow['days'] = []): JobRow => ({ id, runs, days });
const status = (jobs: JobRow[], alerts: JobsStatus['alerts'] = [], err: string | null = null, kalori: KaloriStatus | null = null): JobsView => ({ ok: true, v: 1, now: NOW, ext: { at: NOW, by: 'app', err }, jobs, alerts, kalori });

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
    expect(runLine({ t: NOW - H, st: 'idle', c: 'cancelled', by: 'r' }, NOW)).toBe('11:20 · Cancelled · After a workflow');
  });
});

describe('the verdict', () => {
  it('all well: the count and nothing to do (the first runs to come named); late: keep an eye on it; failing: check it, the rest 「N more below」', () => {
    const ok = status([row('tick', [{ t: NOW, st: 'ok' }]), row('wx', [{ t: NOW, st: 'ok' }]), row('places', [])]);
    expect(verdictOf(ok, NOW)).toMatchObject({ tone: 'good', w: 'healthy', sentence: 'All 2 OK. Nothing to do. First run to come: Place sorting.', needsLook: false });
    const late = status([row('tick', [{ t: NOW - 80 * MIN, st: 'ok' }]), row('wx', [{ t: NOW, st: 'ok' }])]);
    expect(verdictOf(late, NOW)).toMatchObject({ tone: 'warn', w: 'trouble', sentence: 'Keep an eye on Server timer: late or failed once.', needsLook: false });
    const bad = status([row('tick', [{ t: NOW - 3 * H, st: 'ok' }]), row('backup', [{ t: NOW, st: 'fail' }, { t: NOW - D, st: 'fail' }]), row('wx', [{ t: NOW, st: 'fail' }])], [], 'gh_403');
    expect(verdictOf(bad, NOW)).toMatchObject({ tone: 'bad', w: 'failing', needsLook: true, bad: ['backup', 'tick'], warn: ['wx'] });
    expect(verdictOf(bad, NOW).sentence).toBe("Check Backup and Server timer: stopped or failing. 1 more below. Couldn't read GitHub (gh_403).");
  });

  it('an open alert issue: read it first, 「!」 even when every row is well; the flake hunt’s `flake` issue never', () => {
    const alert = { n: 3, title: 'x', label: 'alert', at: NOW };
    expect(verdictOf(status([row('tick', [{ t: NOW, st: 'ok' }])], [alert]), NOW)).toMatchObject({ needsLook: true, sentence: 'Read the open alert.' });
    expect(verdictOf(status([row('tick', [{ t: NOW, st: 'ok' }])], [alert, { ...alert, n: 4 }]), NOW).sentence).toBe('Read the 2 open alerts.');
    const flake = status([row('tick', [{ t: NOW, st: 'ok' }])], [{ ...alert, label: 'flake' }]);
    expect(verdictOf(flake, NOW)).toMatchObject({ needsLook: false, sentence: 'All 1 OK. Nothing to do.' });
    expect(stepsOf(flake, NOW)).toEqual([]);
  });

  it('the recovered and the flake hunt’s failures leave the sentence (their rows say so)', () => {
    const s = status([row('tick', [{ t: NOW, st: 'ok' }]), row('pages', [{ t: NOW - H, st: 'ok' }, { t: NOW - 2 * H, st: 'fail' }]), row('e2e-flake-hunt', [{ t: NOW - H, st: 'fail' }, { t: NOW - D, st: 'fail' }])]);
    expect(verdictOf(s, NOW)).toMatchObject({ tone: 'good', w: 'healthy', needsLook: false, bad: [], warn: [], sentence: 'All 2 OK. Nothing to do.' });
    const { needs, sections } = layout(s, NOW, [], null);
    expect(needs).toEqual([]);
    expect(sections.find((x) => x.id === 'ship')).toMatchObject({ above: 0, fold: true, tone: 'bad', summary: '1 OK · 1 failed' });
  });
});

describe('the bots’ rows (their tabs’ verdicts)', () => {
  const v = (tone: BotVerdict['tone'], needsLook = false): BotVerdict => ({ tone, w: tone === 'bad' ? 'broken' : tone === 'warn' ? 'trouble' : 'healthy', word: '', sentence: '', needsLook });
  const s = status([row('gym', [{ t: NOW, st: 'ok' }]), row('its-health', [{ t: NOW, st: 'ok' }]), row('tick', [{ t: NOW, st: 'ok' }])]);
  const bots = (gym: BotVerdict | null, its: BotVerdict | null = v('good')): SvcIn[] => [{ id: 'gym', v: gym }, { id: 'its', v: its }];

  it('count in the verdict: a broken Gym bot fails it, its own 「!」 a step for you; one that heals on its own, no 「!」', () => {
    expect(verdictOf(s, NOW, bots(v('good')))).toMatchObject({ tone: 'good', sentence: 'All 5 OK. Nothing to do.', needsLook: false });
    expect(verdictOf(s, NOW, bots(v('bad', true)))).toMatchObject({ tone: 'bad', w: 'failing', needsLook: true, bad: ['svc-gym'], sentence: 'Needs you: Gym bot, see below.' });
    expect(verdictOf(s, NOW, bots(v('bad')))).toMatchObject({ tone: 'bad', needsLook: false, sentence: 'Check Gym bot: stopped or failing.' });
    expect(verdictOf(s, NOW, bots(v('good'), v('warn')))).toMatchObject({ tone: 'warn', warn: ['svc-its'], sentence: 'Keep an eye on ITS bot: late or failed once.' });
    // (a fine bot needing a person reads as its dot: amber)
    expect(verdictOf(s, NOW, bots(v('good', true)))).toMatchObject({ tone: 'warn', needsLook: true, sentence: 'Needs you: Gym bot, see below.' });
  });

  it('move up to Needs you, red first, their home counting them; not read yet: unknown, at home, not counted', () => {
    const l = layout(s, NOW, bots(v('warn'), v('bad')), null);
    expect(l.needs.map((x) => [x.key, x.tone])).toEqual([['svc-its', 'bad'], ['svc-gym', 'warn']]);
    expect(l.sections[0]).toMatchObject({ id: 'bots', above: 2 });
    expect(l.sections[0].items.map((x) => x.key)).toEqual(['gym', 'its-health']);
    const unread = layout(s, NOW, bots(null), null);
    expect(unread.sections[0].items.map((x) => [x.key, x.tone])).toEqual([['svc-gym', 'unknown'], ['gym', 'good'], ['svc-its', 'good'], ['its-health', 'good']]);
    expect(verdictOf(s, NOW, bots(null)).sentence).toBe('All 4 OK. Nothing to do.');
    // (a phone without the bots: no rows)
    expect(layout(s, NOW, [], null).sections[0].items.map((x) => x.key)).toEqual(['gym', 'its-health']);
    // (before /jobs answers: the bots' rows only)
    expect(layout(null, NOW, bots(v('good')), null).sections[0].items.map((x) => x.key)).toEqual(['svc-gym', 'svc-its']);
  });
});

describe('a job others wait on', () => {
  it('the server timer stopped: its row says what’s paused, Weather and Place sorting wait on it (neutral, not in Needs you)', () => {
    const s = status([row('tick', [{ t: NOW - 3 * H, st: 'ok' }]), row('wx', [{ t: NOW - 3 * H, st: 'ok' }]), row('places', [{ t: NOW - 3 * H, st: 'idle' }])]);
    const { needs, sections } = layout(s, NOW, [], null);
    expect(needs.map((x) => x.key)).toEqual(['tick']);
    const tick = needs[0].kind === 'job' ? needs[0].h : null;
    expect(whyOf(tick!)).toEqual({ word: 'Stopped', pauses: 'Weather and Place sorting paused' });
    const data = sections.find((x) => x.id === 'data')!;
    expect(data.items.map((x) => (x.kind === 'job' ? [x.key, x.h] : null))).toEqual([['wx', { tone: 'idle', why: 'waiting', on: 'tick' }], ['places', { tone: 'idle', why: 'waiting', on: 'tick' }]]);
    expect(whyOf({ tone: 'idle', why: 'waiting', on: 'tick' }).word).toBe('Waiting on Server timer');
    expect(sections.find((x) => x.id === 'behind')).toMatchObject({ above: 1, items: [], summary: '' });
    expect(verdictOf(s, NOW)).toMatchObject({ tone: 'bad', bad: ['tick'], warn: [], sentence: 'Check Server timer: stopped or failing.' });
  });

  it('the job trigger late: its three, but a dependent that failed on its own stays a failure', () => {
    const s = status([row('dispatch', [{ t: NOW - 80 * MIN, st: 'ok' }]), row('health', [{ t: NOW - 80 * MIN, st: 'ok' }]), row('its-health', [{ t: NOW, st: 'fail' }]), row('places-pull', [{ t: NOW - 80 * MIN, st: 'ok' }])]);
    const { needs, sections } = layout(s, NOW, [], null);
    expect(needs.map((x) => x.key)).toEqual(['its-health', 'dispatch']);
    expect(whyOf(needs[1].kind === 'job' ? needs[1].h : rowHealth(row('tick', []), NOW)).pauses).toBe('Server check, ITS bot check and Google Maps sync paused');
    expect(sections.find((x) => x.id === 'behind')).toMatchObject({ fold: false, summary: '1 waiting' });
  });
});

describe('the folds', () => {
  it('Behind the scenes and Releases fold while healthy: 「All 3 OK」, a job not run yet counted apart; the others never fold', () => {
    const s = status(JOBS.map((j) => row(j.id, j.id === 'relay' ? [] : [{ t: NOW - 5 * MIN, st: 'ok' }])));
    const by = Object.fromEntries(layout(s, NOW, [], null).sections.map((x) => [x.id, x]));
    expect([by.behind.fold, by.behind.summary, by.behind.tone]).toEqual([true, 'All 3 OK', 'good']);
    expect([by.ship.fold, by.ship.summary]).toEqual([true, '3 OK · 1 not run yet']);
    expect([by.bots.foldable, by.data.foldable, by.yours.foldable, by.behind.foldable]).toEqual([false, false, false, true]);
  });
});

it('the strip: 24 cells, the newest at the right edge, the empty ones before; the days: 14 to today', () => {
  const cells = runCells(row('wx', [{ t: NOW, st: 'ok' }, { t: NOW - 30 * MIN, st: 'fail', c: 'timeout' }, { t: NOW - H, st: 'run' }]), NOW);
  expect(cells).toHaveLength(24);
  expect(cells.slice(-3).map((c) => c.state)).toEqual(['none', 'fail', 'ok']);
  expect(cells.at(-2)!.label).toContain('Failed (timeout)');
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

describe('メニュー (the Kalori scraper) as a row, and the sections', () => {
  const PR = 'https://github.com/huangwaylon/fitness/pull/901';
  const k = (over: Record<string, unknown>) => parseStatus({ v: 1, at: NOW - MIN, verdict: 'healthy', reasons: [], next: NOW + 3 * D, history: [], ...over }, NOW)!;
  const all = (kalori: KaloriStatus | null, watch: JobRow['runs'] = [{ t: NOW - H, st: 'ok' }]) => status(JOBS.map((j) => j.id === 'kalori-watch' ? row(j.id, watch) : row(j.id, [{ t: NOW - 5 * MIN, st: 'ok' }])), [], null, kalori);
  const of = (s: JobsView) => {
    const l = layout(s, NOW, [], null);
    return [...l.needs.map((r) => ['needs', r]), ...l.sections.flatMap((x) => x.items.map((r) => [x.id, r]))].flatMap(([id, r]) => (typeof r !== 'string' && r.kind === 'job' ? [[id, r.key, r.h.why]] : []));
  };

  it('by purpose: Bots · Data for the app · Your data · Behind the scenes · Releases (Needs you empty while all is well); the watchdog folded into Chain menus; every job somewhere', () => {
    const s = all(k({}));
    const l = layout(s, NOW, [], null);
    expect(l.needs).toEqual([]);
    expect(l.sections.map((x) => [x.id, x.items.map((r) => r.key)])).toEqual([
      ['bots', ['gym', 'its-health']],
      ['data', ['wx', 'places-pull', 'places', 'places-details', 'kalori-scrape']],
      ['yours', ['backup', 'nightly']],
      ['behind', ['tick', 'dispatch', 'health']],
      ['ship', ['pages', 'relay', 'e2e-logic-full', 'e2e-flake-hunt']]
    ]);
    expect(of(s).length).toBe(JOBS.length - 1);
    expect(verdictOf(s, NOW)).toMatchObject({ tone: 'good', sentence: 'All 15 OK. Nothing to do.', needsLook: false });
  });

  it('held: amber in Needs you with 「!」, the sentence’s step, Needs you’s step and PR', () => {
    const s = all(k({ verdict: 'held', reasons: ['band_gone'], diff: { tripped: [{ code: 'band_gone', key: 'gone', share: 0.021, limit: 0.015 }] }, merge: { pr: PR } }));
    expect(layout(s, NOW, [], null).needs.map((r) => [r.key, r.kind === 'job' && r.h])).toEqual([['kalori-scrape', { tone: 'warn', why: 'held' }]]);
    expect(verdictOf(s, NOW)).toMatchObject({ tone: 'warn', needsLook: true, sentence: "Merge Chain menus' PR." });
    expect(stepsOf(s, NOW)).toEqual([{ id: 'm0', text: 'Check the PR and merge it by hand if it looks right.', links: [{ id: 'pr', href: PR, label: 'Open the PR' }] }]);
  });

  it('failing: red; not run yet: First run at its next; the watchdog stopped: Watch stopped; status.json unread: its runs', () => {
    expect(of(all(k({ verdict: 'failing', reasons: ['crash'] })))[0]).toEqual(['needs', 'kalori-scrape', 'failed']);
    const none = layout(all(k({ verdict: 'none' })), NOW, [], null).sections[1].items.find((r) => r.key === 'kalori-scrape');
    expect(none?.kind === 'job' && none.h).toEqual({ tone: 'idle', why: 'first', next: NOW + 3 * D });
    expect(of(all(k({}), [{ t: NOW - 30 * H, st: 'ok' }]))[0]).toEqual(['needs', 'kalori-scrape', 'watch']);
    expect(of(all(null)).find((x) => x[1] === 'kalori-scrape')).toEqual(['data', 'kalori-scrape', 'ok']);
  });

  it('the kept copy read back with its status.json', () => {
    const s = parseView(JSON.parse(JSON.stringify(all(k({ verdict: 'held' })))));
    expect(s?.kalori?.verdict).toBe('held');
    expect(parseView({ ...all(null), kalori: { v: 9 } })?.kalori).toBeNull();
  });
});

describe('English only, whatever the app’s language', () => {
  it('rows, ages, runs, the days, the facts and Chain menus’ detail read English while the app is Japanese', async () => {
    await loadEnglish();
    expect(i18n.locale).toBe('ja');
    expect([agoOf(NOW - 30_000, NOW), agoOf(NOW - 5 * MIN, NOW), agoOf(NOW - 2 * H, NOW), agoOf(NOW - 3 * D, NOW)]).toEqual(['Just now', '5 min ago', '2 h ago', '3 d ago']);
    expect(runLine({ t: NOW - D, st: 'fail', c: 'failure', ms: 9000, by: 's' }, NOW)).toBe('Mon 11/23 12:20 · Failed (failure) · 9 s · Scheduled');
    expect(runLine({ t: NOW, st: 'ok', ms: 300_000, by: 'p' }, NOW)).toBe('12:20 · OK · 5 min · Push');
    expect(dayCells(row('wx', [], [['2026-11-24', 2, 1]]), NOW).at(-1)!.label).toBe('Tue 11/24 · 2 OK · 1 failed');
    expect(extraRows({ id: 'nightly', runs: [], days: [], x: { ledgercheck: 9.3, tombprune: -1 } }, NOW)).toEqual([
      { id: 'ledgercheck', label: 'Ledger check', value: '9 h ago' }, { id: 'tombprune', label: 'Deleted-row prune', value: 'Not yet' }
    ]);
    // (only while GitHub's read failed)
    expect(factRows(status([row('tick', [])]), NOW)).toEqual([]);
    expect(factRows(status([row('tick', [])], [], 'gh_403'), NOW).map((f) => [f.label, f.value])).toEqual([['GitHub read', '12:20'], ['Auth', 'GitHub App'], ['Error', 'gh_403'], ['Jobs', '1']]);
    const k = parseStatus({ v: 1, at: NOW - MIN, verdict: 'held', reasons: ['band_gone'], next: NOW + 3 * D, history: [], dataset: { tag: 'kalori-2026-11-18', date: '2026-11-18', items: 54269, shops: 448 },
      diff: { added: 12, gone: 1200, valuesChanged: 38, endedChanged: 3, tripped: [{ code: 'band_gone', key: 'gone', share: 0.021, limit: 0.015 }] } }, NOW)!;
    const m = menuDetail(k, NOW);
    expect([m.say, m.next, m.outcome, m.change?.summary]).toEqual([
      "Too many changes, not applied (Removed 2.1%, limit 1.5%). The app keeps Wed 11/18's data.", 'Fri 11/27 12:20', '54,269 items · 448 shops', 'Last changes: Added 12, Values changed 38, Ended 3, Removed 1,200'
    ]);
    expect(m.weeks.empty?.text).toBe('First update around 11/27');
    const all = [verdictOf(status([row('tick', [{ t: NOW - 3 * H, st: 'ok' }])]), NOW).word, m.facts.map((f) => f.label + f.value).join(), m.weeks.summary];
    expect(all.filter((x) => /[ぁ-んァ-ン一-龥]/.test(x))).toEqual([]);
  });
});

describe('Chain menus’ last run', () => {
  // (11/18: its-bot dispatched the week's scrape at 03:42 JST, 16 min; GitHub's late schedule tick at 08:56 found the
  // release out and stopped in 7 s: the row said 「7 s」 beside Took's 「16 min」)
  const now = Date.parse('2026-11-24T19:16+09:00');
  const tick = { t: Date.parse('2026-11-18T08:56:10+09:00'), st: 'ok' as const, ms: 7000, by: 's' as const };
  const scrape = { t: Date.parse('2026-11-18T03:42:05+09:00'), st: 'ok' as const, ms: 16 * MIN + 20_000, by: 'd' as const };
  const gh = row('kalori-scrape', [tick, scrape]);
  const k = (run: Record<string, unknown>) => parseStatus({ v: 1, at: now - D, verdict: 'healthy', reasons: [], next: Date.parse('2026-11-25T02:41+09:00'), history: [], run }, now)!;
  const done = k({ id: 45001, event: 'workflow_dispatch', round: 1, result: 'published', startedAt: scrape.t, endedAt: scrape.t + 16 * MIN + 20_000 });

  it('is status.json’s run, the one Took times: its start, state, duration and trigger', () => {
    const last = lastRun(gh, done)!;
    expect(last).toEqual({ t: scrape.t, st: 'ok', ms: 16 * MIN + 20_000, by: 'd' });
    expect(runLine(last, now)).toBe('Wed 11/18 3:42 · OK · 16 min · Dispatched');
    expect(menuDetail(done, now).facts.find((f) => f.id === 'took')?.value).toBe('16 min');
    expect(agoOf(last.t, now)).toBe('6 d ago');
  });

  it('a run still going has no duration; held, failed and cancelled map to warn, fail and a cancelled idle; no status.json: the newest GitHub run', () => {
    expect(lastRun(gh, k({ id: 1, event: 'schedule', result: 'running', startedAt: now - H }))).toEqual({ t: now - H, st: 'run', by: 's' });
    expect(lastRun(gh, k({ id: 1, result: 'held', startedAt: now - H, endedAt: now }))?.st).toBe('warn');
    expect(lastRun(gh, k({ id: 1, result: 'failed', startedAt: now - H, endedAt: now }))?.st).toBe('fail');
    expect(lastRun(gh, k({ id: 1, result: 'cancelled', startedAt: now - H, endedAt: now }))).toMatchObject({ st: 'idle', c: 'cancelled' });
    expect(lastRun(gh, null)).toBe(tick);
    expect(lastRun(row('wx', [tick]), done)).toBe(tick);
  });
});

describe('the Cloudflare free tier', () => {
  // (12:20 Tokyo = 03:20 UTC: the limits reset at 00:00 UTC, in 20 h)
  const lim = (k: UsageKey, used: number, by: { name: string; n: number }[] = []) => ({ k, used, max: FREE_LIMITS[k], by });
  const usage = (o: Partial<Usage> = {}): Usage => ({ at: NOW - 3 * MIN, day: '2026-11-24', err: null, limits: [lim('wReq', 1377), lim('doRead', 325_265, [{ name: 'test/IslandStore', n: 115_172 }, { name: 'relay/IslandStore', n: 85_156 }]), lim('doWrite', 52_971), lim('doReq', 4633)], ...o });
  const withU = (u: Usage | undefined) => ({ ...status([row('tick', [{ t: NOW, st: 'ok' }])]), ...(u ? { usage: u } : {}) });

  it('tones: green under 60 %, amber from it, red from 85 %', () => {
    expect([usageTone(59_999, 100_000), usageTone(60_000, 100_000), usageTone(84_999, 100_000), usageTone(85_000, 100_000), usageTone(6e6, 5e6)]).toEqual(['good', 'warn', 'warn', 'bad', 'bad']);
    expect([840, 9_960, 38_240, 325_265, 1_254_000, 5_000_000, 100_000].map(compactNum)).toEqual(['840', '10k', '38k', '325k', '1.25M', '5M', '100k']);
    expect(compactNum(4633)).toBe('4.6k');
  });

  it('a row per limit in a fixed order: its share, 「325k / 5M」, the percent floored (<1% for a little), who used it; the reset’s countdown; when read', () => {
    const v = usageView(usage(), NOW)!;
    expect(v.rows.map((r) => [r.k, r.name, r.tone, r.of, r.pct])).toEqual([
      ['doRead', 'DO rows read', 'good', '325k / 5M', '6%'], ['doWrite', 'DO rows written', 'good', '53k / 100k', '52%'],
      ['doReq', 'DO requests', 'good', '4.6k / 100k', '4%'], ['wReq', 'Worker requests', 'good', '1.4k / 100k', '1%']
    ]);
    expect(v.rows[0].by).toEqual([{ name: 'test/IslandStore', n: '115k', pct: '35%' }, { name: 'relay/IslandStore', n: '85k', pct: '26%' }]);
    expect(v.rows[0].share).toBeCloseTo(0.065, 3);
    expect([v.resets, v.asOf, v.note, v.trouble]).toEqual(['Resets in 20 h', '3 min ago', null, false]);
    expect(usageView(usage({ limits: [lim('wReq', 30)] }), NOW)!.rows[0].pct).toBe('<1%');
    expect(usageView(usage(), Date.parse('2026-11-24T23:40:00Z'))!.resets).toBe('Resets in 20 min');
    expect(usageView(undefined, NOW)).toBeNull();
  });

  it('amber and red: in Needs you (a copy: the section keeps all four, last), in the sentence with the 100 % stop; red needs a look', () => {
    expect(verdictOf(withU(usage()), NOW)).toMatchObject({ tone: 'good', needsLook: false, sentence: 'All 1 OK. Nothing to do.' });
    const amber = withU(usage({ limits: [lim('doWrite', 72_000)] }));
    expect(usageView(amber.usage, NOW)!.trouble).toBe(true);
    expect(verdictOf(amber, NOW)).toMatchObject({ tone: 'warn', w: 'trouble', needsLook: false, sentence: 'Watch Cloudflare use: DO rows written at 72%; the app stops at 100%.' });
    const red = withU(usage({ limits: [lim('doRead', 4_600_000), lim('doWrite', 61_000), lim('wReq', 10)] }));
    expect(verdictOf(red, NOW)).toMatchObject({ tone: 'bad', w: 'failing', needsLook: true, sentence: 'Cut Cloudflare use: DO rows read at 92%; the app stops at 100%. 1 more below.' });
    const l = layout(red, NOW, [], usageView(red.usage, NOW));
    expect(l.needs.map((x) => [x.key, x.tone])).toEqual([['cf-doRead', 'bad'], ['cf-doWrite', 'warn']]);
    expect(l.sections.at(-1)).toMatchObject({ id: 'cf', above: 0 });
    expect(l.sections.at(-1)!.items.map((x) => x.key)).toEqual(['cf-doRead', 'cf-doWrite', 'cf-wReq']);
  });

  it('unavailable: its code, no rows, no verdict; couldn’t refresh: the day’s last reading kept; an earlier day’s: idle, never trouble', () => {
    const none = usageView(usage({ limits: [], day: null, err: 'no_token' }), NOW)!;
    expect([none.rows, none.note, none.asOf]).toEqual([[], 'Usage unavailable (no_token).', null]);
    expect(verdictOf(withU(usage({ limits: [], day: null, err: 'timeout' })), NOW).tone).toBe('good');
    expect(usageView(usage({ err: 'http_500' }), NOW)!.note).toBe("Couldn't refresh (http_500); the last reading today.");
    const old = withU(usage({ day: '2026-11-23', limits: [lim('doRead', 4_900_000)] }));
    expect(usageView(old.usage, NOW)).toMatchObject({ trouble: false, note: 'Last reading from 2026-11-23 (UTC); the limits have reset since.', rows: [{ tone: 'idle' }] });
    expect(verdictOf(old, NOW).needsLook).toBe(false);
  });

  it('read back: bad limits dropped, unknown keys too; none: no usage', () => {
    const s = parseJobs({ ok: true, v: 1, now: NOW, ext: { at: NOW, by: 'app', err: null }, jobs: [], alerts: [],
      usage: { at: NOW, day: '2026-11-24', err: null, limits: [lim('doRead', 5), { k: 'nope', used: 1, max: 2 }, { k: 'wReq', used: 'x', max: 1 }, { k: 'doReq', used: 1, max: 0 }] } });
    expect(s?.usage).toEqual({ at: NOW, day: '2026-11-24', err: null, limits: [lim('doRead', 5)] });
    expect(parseJobs({ ok: true, v: 1, now: NOW, ext: {}, jobs: [], alerts: [] })?.usage).toBeUndefined();
  });
});
