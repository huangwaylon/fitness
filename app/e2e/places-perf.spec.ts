// 保存した場所's perf check (PLACES_PERF=1; docs/places.md "Search"): 3,500 invented places, each keystroke's search
// timed (the view's own measure, window.__places.searchMs: under 5 ms, no debounce) and the virtualised list scrolled
// a screen a frame (its frames' p95).
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu, unfoldMenu } from './hud.ts';
import { readFileSync } from 'node:fs';
import { placeRows } from '../src/lib/contract/places.ts';
import { bigPlaces } from './placesBig.ts';
import { newRecord } from './record.ts';
import { manyPlaces, routePlaces } from './places.ts';

test.use({ viewport: { width: 393, height: 852 } });
const view = (p: Page) => p.locator('dialog[open] [data-places]');

async function phone(page: Page, context: BrowserContext) {
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await newRecord().pair(context, 'A');
  await routePlaces(page, manyPlaces(3500));
  await page.goto('');
  await islandUp(page);
}

test('perf: 3,500 places, each keystroke’s search under 5 ms, the list scrolled smoothly', async ({ page, context }, info) => {
  test.skip(!process.env.PLACES_PERF, 'PLACES_PERF=1');
  await phone(page, context);
  await fromMenu(page, 'places');
  await expect(view(page).locator('[data-places-meta]')).toContainText('3,500件');
  const q = view(page).locator('[data-places-q]');
  await q.focus();
  const ms: number[] = [];
  for (const ch of 'テスト12番') {
    await q.pressSequentially(ch);
    ms.push(await page.evaluate(() => (window as unknown as { __places: { searchMs: number } }).__places.searchMs));
  }
  await q.fill('');
  await q.blur();
  const frames = await view(page).locator('[data-places-list]').evaluate(async (el) => {
    const out: number[] = [];
    let last = performance.now();
    for (let i = 0; i < 120; i++) {
      el.scrollTop += 280;
      await new Promise((r) => requestAnimationFrame(r));
      const t = performance.now();
      out.push(t - last);
      last = t;
    }
    return out.sort((a, b) => a - b);
  });
  const p95 = frames[Math.floor(frames.length * 0.95)];
  console.log(`places perf ${info.project.name}: search ms ${ms.map((x) => x.toFixed(2)).join(' ')}; scroll p95 ${p95.toFixed(1)} ms`);
  expect(Math.max(...ms)).toBeLessThan(5);
  expect(p95).toBeLessThan(40);
});

// The first opening (T1's phones: 278 ms typical, 959 at worst, from the sheet's own work): the copy on the phone (a
// launch after one that fetched), the sheet tapped open and timed in the page from the tap: its first row drawn (the
// frame after it's in), the longest frame, the long tasks (Chromium's). PLACES_PRIME: the idle prefetch's prime first
// (the phones' usual case); PLACES_CPU throttles Chromium's CPU (4× is a little slower than the phones); PLACES_REAL a
// payload file of the real list's shape, read locally only (never in the repo).
test('perf: the first opening with the copy on the phone, the first rows drawn quickly', async ({ page, context }, info) => {
  test.skip(!process.env.PLACES_PERF, 'PLACES_PERF=1');
  test.setTimeout(180_000);
  await context.addInitScript(() => localStorage.setItem('e2e.render', 'none'));
  await newRecord().pair(context, 'A');
  const real = process.env.PLACES_REAL;
  await routePlaces(page, real ? placeRows(JSON.parse(readFileSync(real, 'utf8'))) : bigPlaces());
  await page.goto('');
  await islandUp(page);
  await fromMenu(page, 'places');
  await expect(view(page).locator('[data-place-row]').first()).toBeVisible();
  const out: string[] = [], firsts: number[] = [];
  for (let k = 0; k < Number(process.env.PLACES_RUNS ?? 3); k++) {
    await page.reload();
    await islandUp(page);
    await page.waitForTimeout(2500);
    const cdp = info.project.name.startsWith('chromium') ? await context.newCDPSession(page) : null;
    if (cdp) await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(process.env.PLACES_CPU ?? 1) });
    await unfoldMenu(page);
    // (the idle prefetch's prime, as on a phone a while after the launch: the specs block the worker, so it never runs on
    // its own; a press on the pill asks it, let go of)
    if (process.env.PLACES_PRIME) {
      await page.locator('[data-hud-places]').evaluate((b) => (b.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9 })), b.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 9 }))));
      await page.waitForTimeout(3000);
    }
    await page.evaluate(() => {
      const o: { t0: number; rows: number; frames: number[]; long: number[] } = { t0: 0, rows: 0, frames: [], long: [] };
      (window as unknown as { __open: typeof o }).__open = o;
      document.addEventListener('pointerdown', () => {
        o.t0 = performance.now();
        const f = (t: number) => (o.frames.push(t), t - o.t0 < 2500 && requestAnimationFrame(f));
        requestAnimationFrame(f);
        const mo = new MutationObserver(() => {
          if (!document.querySelector('dialog[open] [data-place-row]')) return;
          mo.disconnect();
          requestAnimationFrame(() => (o.rows = performance.now() - o.t0));
        });
        mo.observe(document.body, { subtree: true, childList: true });
      }, { capture: true, once: true });
      try {
        new PerformanceObserver((l) => l.getEntries().forEach((e) => o.long.push(e.duration))).observe({ type: 'longtask' });
      } catch { /* (WebKit: none) */ }
    });
    await page.locator('[data-hud-places]').click();
    await expect(view(page).locator('[data-place-row]').first()).toBeVisible();
    await page.waitForTimeout(3000);
    const r = await page.evaluate(() => (window as unknown as { __open: { t0: number; rows: number; frames: number[]; long: number[] } }).__open);
    if (cdp) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    firsts.push(r.rows);
    const gaps = r.frames.slice(1).map((t, i) => t - r.frames[i]);
    out.push(`rows ${r.rows.toFixed(0)} ms, longest frame ${Math.max(...gaps).toFixed(0)} ms, long tasks ${r.long.map((x) => x.toFixed(0)).join('+') || '-'}`);
  }
  console.log(`places open ${info.project.name} cpu×${process.env.PLACES_CPU ?? 1}${real ? ' real' : ''}${process.env.PLACES_PRIME ? ' primed' : ''}:\n  ${out.join('\n  ')}`);
  // (primed, unthrottled: the opening's rows within ~100 ms, as on the phones' target; 2026-11-24 ~20-30 ms, before 70-90)
  if (process.env.PLACES_PRIME && !process.env.PLACES_CPU) expect(firsts.sort((a, b) => a - b)[firsts.length >> 1]).toBeLessThan(100);
});
