import { afterEach, describe, expect, it } from 'vitest';
import { cleanData } from '#lib/contract/log.ts';
import { watchLaunchSw } from '#lib/sync/cacheEarly.ts';
import { launchSw } from './launchSw.ts';

const resetLaunchSw = () => void delete (globalThis as { __islandSw?: unknown }).__islandSw;

/** A registration as getRegistration gives it: its workers, and its updatefound listener to fire. */
function reg(over: { installing?: object; waiting?: object } = {}) {
  let fire = () => {};
  const r = { installing: null, waiting: null, ...over, addEventListener: (_: string, f: () => void) => void (fire = f) };
  return { sw: { getRegistration: () => Promise.resolve(r) } as unknown as ServiceWorkerContainer, fire: () => fire() };
}
const T = (name: string, startTime: number, responseEnd: number) => ({ name, startTime, responseEnd });

afterEach(resetLaunchSw);

describe('launchSw (perf.boot swi, chunkEnd)', () => {
  it('none beside the launch: no swi; the last app file begun before the mount and the count', async () => {
    const { sw } = reg();
    watchLaunchSw(sw);
    await Promise.resolve();
    const r = launchSw(300, [T('https://x/_app/immutable/entry/start.js', 5, 40), T('https://x/_app/immutable/chunks/a.js', 120, 260.6), T('https://x/room/world3d/a.glb', 50, 900), T('https://x/_app/immutable/chunks/late.js', 400, 800)]);
    expect(r).toEqual({ chunkEnd: 261, chunkN: 2 });
    expect(cleanData('perf.boot', r)).toEqual(r);
  });

  it('a worker installing or waiting at the start; one found during the launch with its time; the first kept', async () => {
    const w = reg({ waiting: {} });
    watchLaunchSw(w.sw);
    await Promise.resolve();
    w.fire();
    expect(launchSw(0, [])).toEqual({ swi: 'wait' });
    resetLaunchSw();
    const f = reg();
    watchLaunchSw(f.sw);
    await Promise.resolve();
    f.fire();
    const r = launchSw(0, []);
    expect(r.swi).toBe('found');
    expect(r.swiMs).toBeGreaterThanOrEqual(0);
    expect(cleanData('perf.boot', r)).toEqual(r);
  });

  it('no worker API, or no registration: nothing', async () => {
    watchLaunchSw(undefined);
    watchLaunchSw({ getRegistration: () => Promise.resolve(undefined) } as unknown as ServiceWorkerContainer);
    await Promise.resolve();
    expect(launchSw(0, [])).toEqual({});
  });
});
