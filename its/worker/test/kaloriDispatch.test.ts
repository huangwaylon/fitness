// Kalori's weekly run dispatched by the cron (src/dispatch.ts dispatchKalori): which ticks may send it, the runs asked
// first (this week's weekly one, unfinished), the request GitHub gets (the scheduled run's: main, no inputs but `weekly`), and an
// unknown answer sending nothing, with a stubbed fetch.
import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KALORI_DISPATCH_URL, KALORI_WEEKLY_TITLE, UNFINISHED, dispatchKalori, kaloriRecentUrl, kaloriSlot, kaloriUnfinishedUrl } from '../src/dispatch.ts';

// Tuesday 2026-11-17: the schedule at 17:41 UTC
const SLOT = Date.parse('2026-11-17T17:41:00Z');
const at = (iso: string) => Date.parse(`${iso}:00Z`);
const runs = (n: number) => Response.json({ total_count: n, workflow_runs: [] });
/** The runs list as GitHub has it: each run's event and display_title (its run-name). */
const listed = (...rs: [string, string][]) => Response.json({ total_count: rs.length, workflow_runs: rs.map(([event, display_title], i) => ({ id: i + 1, event, display_title })) });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/** fetch answering the runs asked with `count(url)` runs, and the dispatch with `dispatch`. */
function stub(count: (url: string) => number | Response, dispatch = 204) {
  const f = vi.fn(async (url: string, _init?: RequestInit) => {
    if (url === KALORI_DISPATCH_URL) return new Response(null, { status: dispatch });
    const c = count(url);
    return typeof c === 'number' ? runs(c) : c;
  });
  vi.stubGlobal('fetch', f);
  return f;
}

describe('the ticks that may dispatch Kalori’s weekly run', () => {
  it('Tuesday from an hour past 17:41 UTC, for 2 h; never another day or time', () => {
    expect(kaloriSlot(at('2026-11-17T18:45'))).toBe(SLOT);
    expect(kaloriSlot(at('2026-11-17T20:40'))).toBe(SLOT);
    expect([at('2026-11-17T17:45'), at('2026-11-17T18:40'), at('2026-11-17T20:45'), at('2026-11-18T18:45'), at('2026-11-10T19:00') + 86_400_000].map(kaloriSlot))
      .toEqual([null, null, null, null, null]);
    expect(kaloriSlot(at('2026-11-10T19:00'))).toBe(Date.parse('2026-11-10T17:41:00Z'));
  });
  it('asks for the runs created since a day before the schedule', () => {
    expect(kaloriRecentUrl(SLOT)).toBe('https://api.github.com/repos/huangwaylon/fitness/actions/workflows/kalori-scrape.yml/runs?created=%3E%3D2026-11-16T17%3A41%3A00Z&per_page=100');
  });
});

describe('dispatchKalori', () => {
  it('no run this week and none unfinished: one workflow_dispatch on main, the scheduled run’s (weekly, no other input)', async () => {
    const line = vi.spyOn(console, 'log').mockImplementation(() => {});
    const f = stub(() => 0);
    expect(await dispatchKalori('tok', at('2026-11-17T18:45'))).toBe('sent status=204');
    expect(f.mock.calls.map((c) => c[0])).toEqual([kaloriRecentUrl(SLOT), ...UNFINISHED.map(kaloriUnfinishedUrl), KALORI_DISPATCH_URL]);
    const init = f.mock.calls.at(-1)![1]!;
    expect([init.method, JSON.parse(String(init.body)), (init.headers as Record<string, string>).Authorization]).toEqual(['POST', { ref: 'main', inputs: { weekly: 'true' } }, 'Bearer tok']);
    expect(line.mock.calls).toEqual([['its kalori-dispatch sent status=204']]);
  });

  it('a weekly run this week (GitHub’s schedule ran, or the last tick’s dispatch): nothing sent', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    for (const run of [['schedule', 'Kalori scrape'], ['workflow_dispatch', KALORI_WEEKLY_TITLE]] as [string, string][]) {
      const f = stub((url) => (url === kaloriRecentUrl(SLOT) ? listed(['workflow_dispatch', 'Kalori scrape'], run) : 0));
      expect(await dispatchKalori('tok', at('2026-11-17T18:50'))).toBe('skip why=recent');
      expect(f).toHaveBeenCalledTimes(1);
    }
  });

  it('a smoke, a retry’s round or a run by hand this week is no weekly run: the dispatch goes', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const f = stub((url) => (url === kaloriRecentUrl(SLOT) ? listed(['workflow_dispatch', 'Kalori scrape'], ['workflow_dispatch', 'Kalori scrape (round 2)']) : 0));
    expect(await dispatchKalori('tok', at('2026-11-17T18:50'))).toBe('sent status=204');
    expect(f.mock.calls.at(-1)![0]).toBe(KALORI_DISPATCH_URL);
  });

  it('the workflow names a weekly run as the check reads it', () => {
    const yml = readFileSync(`${import.meta.dirname}/../../../.github/workflows/kalori-scrape.yml`, 'utf8');
    expect(yml).toMatch(/^run-name: .*\(github\.event_name == 'schedule' \|\| inputs\.weekly\) && '([^']+)'/m);
    expect(yml.match(/^run-name: .*&& '([^']+)'/m)![1]).toBe(KALORI_WEEKLY_TITLE);
  });

  it('a run unfinished (an older round queued or running): nothing sent', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const f = stub((url) => (url === kaloriUnfinishedUrl('queued') ? 1 : 0));
    expect(await dispatchKalori('tok', at('2026-11-17T19:00'))).toBe('skip why=queued');
    expect(f.mock.calls.map((c) => c[0])).not.toContain(KALORI_DISPATCH_URL);
  });

  it('an unknown answer (a refusal, no answer, another body): nothing sent, one warn line; never throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let f = stub(() => new Response('', { status: 401 }));
    expect(await dispatchKalori('tok', at('2026-11-17T19:00'))).toBe('unknown asked=recent');
    expect(f.mock.calls.map((c) => c[0])).not.toContain(KALORI_DISPATCH_URL);
    f = stub((url) => (url === kaloriUnfinishedUrl('in_progress') ? Response.json({ message: 'x' }) : 0));
    expect(await dispatchKalori('tok', at('2026-11-17T19:00'))).toBe('unknown asked=in_progress');
    expect(f.mock.calls.map((c) => c[0])).not.toContain(KALORI_DISPATCH_URL);
    vi.stubGlobal('fetch', async () => { throw new TypeError('network down'); });
    expect(await dispatchKalori('tok', at('2026-11-17T19:00'))).toBe('unknown asked=recent');
    expect(warn.mock.calls).toEqual([['its kalori-dispatch unknown asked=recent'], ['its kalori-dispatch unknown asked=in_progress'], ['its kalori-dispatch unknown asked=recent']]);
  });

  it('a refused dispatch warns (the next tick tries again); no token or a tick not due: nothing sent', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    stub(() => 0, 403);
    expect(await dispatchKalori('tok', at('2026-11-17T19:00'))).toBe('refused status=403');
    const f = stub(() => 0);
    expect(await dispatchKalori(undefined, at('2026-11-17T19:00'))).toBe('no_token');
    expect(await dispatchKalori('tok', at('2026-11-17T17:45'))).toBeNull();
    expect(await dispatchKalori('tok', at('2026-11-18T19:00'))).toBeNull();
    expect(f).not.toHaveBeenCalled();
    expect(warn.mock.calls).toEqual([['its kalori-dispatch refused status=403'], ['its kalori-dispatch no_token']]);
  });
});
