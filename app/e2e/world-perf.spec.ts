// The world's measurements (opt-in: WORLD_PERF=1 npx playwright test e2e/world-perf.spec.ts): fling-scroll frame times
// at 4x CPU throttling on the iPhone 13 viewport (an independent rAF sampler during the gesture: p95, max, frames over
// 33 ms, long tasks, the projector's style writes per frame), nothing pending once still, and screenshots of each stop
// (まえ, おく) at 390 × 844 and 320 × 568, by day, at night, in rain and in snow, into /tmp/world-build/.
// Numbers go to /tmp/world-build/perf.json.
import { expect, test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = '/tmp/world-build';
test.skip(!process.env.WORLD_PERF, 'the world’s measurements run on demand (WORLD_PERF=1)');
test.describe.configure({ mode: 'serial' });
const results: Record<string, unknown> = {};
type W = { go(z: number): void; idle(): boolean; perf: { writes: number; nodes: number } };

async function fling(page: Page, dy: number) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.evaluate(() => {
    const w = window as unknown as { __samp: { gaps: number[]; writes: number[]; long: number; on: boolean }; __world: W };
    w.__samp = { gaps: [], writes: [], long: 0, on: true };
    let last = 0;
    const f = (t: number) => {
      if (last) w.__samp.gaps.push(t - last);
      w.__samp.writes.push(w.__world.perf.writes);
      last = t;
      if (w.__samp.on) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
    try {
      new PerformanceObserver((l) => (w.__samp.long += l.getEntries().length)).observe({ type: 'longtask' });
    } catch { /* no longtask */ }
  });
  await cdp.send('Input.synthesizeScrollGesture', {
    x: 195, y: dy > 0 ? 60 : 600, yDistance: dy, speed: 2400, gestureSourceType: 'touch', preventFling: false, repeatCount: 1
  });
  await page.waitForTimeout(1200);
  const r = await page.evaluate(() => {
    const w = window as unknown as { __samp: { gaps: number[]; writes: number[]; long: number; on: boolean } };
    w.__samp.on = false;
    const g = [...w.__samp.gaps].sort((a, b) => a - b), wr = [...w.__samp.writes].sort((a, b) => a - b);
    return {
      frames: g.length, p95: g[Math.floor(g.length * 0.95)], max: g.at(-1), over33: g.filter((x) => x > 33.4).length, long: w.__samp.long,
      writesMedian: wr[Math.floor(wr.length / 2)], writesMax: wr.at(-1)
    };
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  return r;
}

test('fling at 4x throttle (iPhone 13 viewport)', async ({ page }) => {
  await page.goto('?demo&season=summer&date=2026-07-01T10:00');
  await page.waitForFunction(() => (window as unknown as { __world?: W }).__world);
  await page.waitForTimeout(2500);
  const up = await fling(page, 540);
  const down = await fling(page, -540);
  // once the scroll has settled (a snap may still be easing it to a stop) and nobody walks, no frame is pending
  await expect.poll(() => page.evaluate(() => (window as unknown as { __world: W }).__world.idle()), { timeout: 8000 }).toBe(true);
  const idle = await page.evaluate(() => (window as unknown as { __world: W }).__world.idle());
  const nodes = await page.evaluate(() => (window as unknown as { __world: W }).__world.perf.nodes);
  results.fling = { up, down, idleAfter: idle, nodes };
  expect(idle).toBe(true);
  expect(up.frames).toBeGreaterThan(5);
});

const LOOKS = [
  ['day', 'date=2026-07-01T10:00&weather=clear'],
  ['night', 'date=2026-07-01T22:00&weather=clear'],
  ['rain', 'date=2026-07-01T10:00&weather=rain'],
  ['snow', 'date=2027-01-12T10:00&weather=snow']
] as const;
for (const [w, h] of [[390, 844], [320, 568]])
  for (const [look, q] of LOOKS)
    test(`screenshots ${w}x${h} ${look}`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await page.goto(`?demo&${q}`);
      await page.waitForFunction(() => (window as unknown as { __world?: W }).__world);
      await page.waitForTimeout(1500);
      for (const [name, cam] of [['mae', -13], ['oku', 642]] as const) {
        await page.evaluate((z) => (window as unknown as { __world: W }).__world.go(z), cam);
        await page.waitForTimeout(1200);
        await page.screenshot({ path: `${OUT}/${name}-${look}-${w}x${h}.png` });
      }
    });

test.afterAll(() => {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/perf.json`, JSON.stringify(results, null, 2));
});
