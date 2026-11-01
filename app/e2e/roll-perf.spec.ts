// The rolling-log spike's measurements (opt-in: ROLL_SPIKE=1 npx playwright test e2e/roll-perf.spec.ts): fling-scroll
// frame times at 4x CPU throttling (the page's own per-fling stats: rAF intervals while moving, writes per frame,
// long tasks), at 1x and 2x the sprites, and screenshots at Home, mid and Back (390 × 844 and 320 × 568, cylinder and
// parabola) into /tmp/roll-spike/. Numbers go to /tmp/roll-spike/perf.json.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = '/tmp/roll-spike';
test.skip(!process.env.ROLL_SPIKE, 'the spike’s measurements run on demand (ROLL_SPIKE=1)');
test.describe.configure({ mode: 'serial' });
const results: Record<string, unknown> = {};

type Fling = { frames: number; p95: number; max: number; over33: number; long: number; maxUpdated: number; meanUpdated: number; sampler?: unknown };

async function fling(page: Page, dy: number): Promise<Fling> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const n0 = await page.evaluate(() => (window as unknown as { __roll: { stats: { flings: unknown[] } } }).__roll.stats.flings.length);
  // an independent sampler: every rAF interval and long task during the gesture
  await page.evaluate(() => {
    const w = window as unknown as { __samp: { gaps: number[]; long: number; on: boolean } };
    w.__samp = { gaps: [], long: 0, on: true };
    let last = 0;
    const f = (t: number) => {
      if (last) w.__samp.gaps.push(t - last);
      last = t;
      if (w.__samp.on) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
    try {
      new PerformanceObserver((l) => (w.__samp.long += l.getEntries().length)).observe({ type: 'longtask' });
    } catch { /* no longtask */ }
  });
  await cdp.send('Input.synthesizeScrollGesture', {
    x: 195, y: dy > 0 ? 250 : 650, yDistance: dy, speed: 2400, gestureSourceType: 'touch', preventFling: false, repeatCount: 1
  });
  await page.waitForFunction((n) => (window as unknown as { __roll: { stats: { flings: unknown[] } } }).__roll.stats.flings.length > n, n0, { timeout: 15000 });
  await page.waitForTimeout(600);
  const samp = await page.evaluate(() => {
    const w = window as unknown as { __samp: { gaps: number[]; long: number; on: boolean } };
    w.__samp.on = false;
    const g = [...w.__samp.gaps].sort((a, b) => a - b);
    return { frames: g.length, p95: g[Math.floor(g.length * 0.95)], max: g.at(-1), over33: g.filter((x) => x > 33.4).length, long: w.__samp.long };
  });
  const f = await page.evaluate(() => (window as unknown as { __roll: { stats: { flings: Fling[] } } }).__roll.stats.flings);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  // a fling can end in two parts (the drag, then the momentum after a pause): take the longest
  return { ...f.slice(n0).sort((a, b) => b.frames - a.frames)[0], sampler: samp };
}

for (const variant of ['', '&x2']) {
  test(`fling at 4x throttle${variant ? ' (2x sprites)' : ''}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`roll?demo&still&perf${variant}`);
    await page.waitForFunction(() => (window as unknown as { __roll?: unknown }).__roll);
    await page.waitForTimeout(1500);
    const up = await fling(page, 600);
    const down = await fling(page, -600);
    const idle = await page.evaluate(() => (window as unknown as { __roll: { idle(): boolean } }).__roll.idle());
    results[`fling${variant || '-x1'}`] = { up, down, idleAfter: idle };
    await page.screenshot({ path: `${OUT}/perf-overlay${variant.replace('&', '-')}.png` });
    expect(idle).toBe(true);
    expect(up.frames).toBeGreaterThan(5);
  });
}

for (const [w, h] of [[390, 844], [320, 568]])
  for (const curve of ['cylinder', 'parabola'])
    test(`screenshots ${w}x${h} ${curve}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      for (const [name, cam] of [['home', 300], ['mid', 1060], ['back', 1820]] as const) {
        await page.goto(`roll?demo&still&cam=${cam}&curve=${curve}`);
        await page.waitForFunction(() => (window as unknown as { __roll?: unknown }).__roll);
        await page.waitForTimeout(1200);
        await page.screenshot({ path: `${OUT}/${curve}-${name}-${w}x${h}.png` });
      }
    });

test.afterAll(() => {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/perf.json`, JSON.stringify(results, null, 2));
});
