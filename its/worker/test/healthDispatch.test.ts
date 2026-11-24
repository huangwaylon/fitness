// The health workflows' dispatch on the cron (src/dispatch.ts dispatchHealth): which tick dispatches what, the request
// GitHub gets, no token (nothing sent), and a refusal or no answer warned, with a stubbed fetch.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { dispatchHealth, dueHealth, healthDispatchUrl } from '../src/dispatch.ts';

const at = (hhmm: string) => Date.parse(`2026-11-14T${hhmm}:00Z`);

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('the health workflows dispatched by the cron', () => {
  it('health.yml, its-health.yml and places-pull.yml at :15 and :45, places-details.yml at 18:30, nothing on the other */5 ticks', () => {
    expect(dueHealth(at('03:15'))).toEqual(['health', 'its-health', 'places-pull']);
    expect(dueHealth(at('03:45'))).toEqual(['health', 'its-health', 'places-pull']);
    expect([at('03:00'), at('03:10'), at('03:20'), at('03:30'), at('03:50')].map((t) => dueHealth(t))).toEqual([[], [], [], [], []]);
    // places-details.yml once a day, at 18:30 UTC only
    expect([at('18:30'), at('18:25'), at('19:30')].map((t) => dueHealth(t))).toEqual([['places-details'], [], []]);
  });

  it('the booker active: its-health.yml every 15 min (:00 and :30 too), the other ticks as before', () => {
    expect([at('03:00'), at('03:15'), at('03:30'), at('03:45'), at('03:05'), at('18:30')].map((t) => dueHealth(t, true))).toEqual([
      ['its-health'], ['health', 'its-health', 'places-pull'], ['its-health'], ['health', 'its-health', 'places-pull'], [], ['its-health', 'places-details'],
    ]);
  });

  it('POSTs a workflow_dispatch on main with the token; 204 warns nothing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const f = vi.fn(async (_url: string, _init: RequestInit) => new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', f);
    expect(await dispatchHealth('tok', at('09:15'))).toEqual([{ wf: 'health', st: 204 }, { wf: 'its-health', st: 204 }, { wf: 'places-pull', st: 204 }]);
    expect(f.mock.calls.map((c) => c[0])).toEqual([healthDispatchUrl('health'), healthDispatchUrl('its-health'), healthDispatchUrl('places-pull')]);
    expect(f.mock.calls[2][0]).toBe('https://api.github.com/repos/huangwaylon/fitness/actions/workflows/places-pull.yml/dispatches');
    expect(f.mock.calls[0][0]).toBe('https://api.github.com/repos/huangwaylon/fitness/actions/workflows/health.yml/dispatches');
    const init = f.mock.calls[0][1];
    expect([init.method, JSON.parse(String(init.body)), (init.headers as Record<string, string>).Authorization]).toEqual(['POST', { ref: 'main' }, 'Bearer tok']);
    expect(warn).not.toHaveBeenCalled();
  });

  it('no token: nothing sent, one line; a tick with nothing due sends nothing', async () => {
    const line = vi.spyOn(console, 'log').mockImplementation(() => {});
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await dispatchHealth(undefined, at('09:15'))).toEqual([]);
    expect(await dispatchHealth('tok', at('09:20'))).toEqual([]);
    expect(f).not.toHaveBeenCalled();
    expect(line.mock.calls).toEqual([['its health-dispatch no_token']]);
  });

  it('a refusal or no answer: one warn line each, with its status; never throws', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.stubGlobal('fetch', async (url: string) => {
      if (url.includes('/health.yml/')) return new Response('', { status: 401 });
      throw new TypeError('network down');
    });
    expect(await dispatchHealth('tok', at('09:45'))).toEqual([{ wf: 'health', st: 401 }, { wf: 'its-health', st: 0 }, { wf: 'places-pull', st: 0 }]);
    expect(await dispatchHealth('tok', at('09:15'))).toEqual([{ wf: 'health', st: 401 }, { wf: 'its-health', st: 0 }, { wf: 'places-pull', st: 0 }]);
    expect(warn.mock.calls.slice(3)).toEqual([['its health-dispatch refused wf=health status=401'], ['its health-dispatch refused wf=its-health status=0'], ['its health-dispatch refused wf=places-pull status=0']]);
  });
});
