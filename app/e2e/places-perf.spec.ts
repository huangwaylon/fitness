// 保存した場所's perf check (PLACES_PERF=1; docs/places.md "Search"): 3,500 invented places, each keystroke's search
// timed (the view's own measure, window.__places.searchMs: under 5 ms, no debounce) and the virtualised list scrolled
// a screen a frame (its frames' p95).
import { expect, test, type BrowserContext, type Page } from './fixtures.ts';
import { islandUp } from './island.ts';
import { fromMenu } from './hud.ts';
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
