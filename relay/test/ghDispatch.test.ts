// The health workflows' dispatch (relay/src/ghDispatch.ts): which a tick dispatches, the request GitHub gets, no token
// (nothing sent), and a refusal or no answer logged, with a fake fetch.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dispatchHealth, dispatchUrl, dueWorkflows } from '../src/ghDispatch.ts';
import type { RelayEvent } from '../src/log.ts';

const at = (hhmm: string) => Date.parse(`2026-11-14T${hhmm}:00Z`);

afterEach(() => vi.restoreAllMocks());

describe('the health workflows dispatched by the cron', () => {
  it('health.yml at :15, its-health.yml at :15 and :45', () => {
    expect(dueWorkflows(at('03:15'))).toEqual(['health', 'its-health']);
    expect(dueWorkflows(at('03:45'))).toEqual(['its-health']);
  });

  it('POSTs a workflow_dispatch on main with the token; 204 logs nothing', async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const logged: RelayEvent[] = [];
    const r = await dispatchHealth('tok', at('09:15'), (e) => logged.push(...e), async (url, init) => (calls.push({ url, init }), { ok: true, status: 204 }));
    expect(r).toEqual([{ wf: 'health', st: 204 }, { wf: 'its-health', st: 204 }]);
    expect(calls.map((c) => c.url)).toEqual([dispatchUrl('health'), dispatchUrl('its-health')]);
    expect(calls[0].url).toBe('https://api.github.com/repos/huangwaylon/fitness/actions/workflows/health.yml/dispatches');
    expect(calls[0].init.method).toBe('POST');
    expect(JSON.parse(String(calls[0].init.body))).toEqual({ ref: 'main' });
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
    expect(logged).toEqual([]);
  });

  it('no token: nothing sent, one line', async () => {
    const line = vi.spyOn(console, 'log').mockImplementation(() => {});
    const f = vi.fn();
    expect(await dispatchHealth(undefined, at('09:15'), () => {}, f)).toBeNull();
    expect(f).not.toHaveBeenCalled();
    expect(line.mock.calls).toEqual([['health-dispatch no_token']]);
  });

  it('a refusal or no answer: cron.gh, warn, with its status; never throws', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logged: RelayEvent[] = [];
    const r = await dispatchHealth('tok', at('09:15'), (e) => logged.push(...e), async (url) => {
      if (url.includes('/health.yml/')) return { ok: false, status: 401 };
      throw new TypeError('network down');
    });
    expect(r).toEqual([{ wf: 'health', st: 401 }, { wf: 'its-health', st: 0 }]);
    expect(logged).toEqual([{ e: 'cron.gh', l: 2, d: { wf: 'health', st: 401 } }, { e: 'cron.gh', l: 2, d: { wf: 'its-health', st: 0 } }]);
  });
});
