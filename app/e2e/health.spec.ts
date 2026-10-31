// けんこう (design.md "Kenkou"): the panel's Health tab for the trainer. Open it, switch the period, page through the
// history (‹ ›, a drag on a chart, きょう), tap a bar for its numbers, switch whose data (one person at a time); on `?demo` and a longer
// `?demo&weeks=60`, at 390 and 320.
import { expect, test, type Page } from '@playwright/test';

const sheet = (page: Page) => page.locator('dialog[open]');

async function openHealth(page: Page, query = '?demo') {
  await page.clock.install({ time: new Date('2026-10-31T12:10:00+09:00') });
  await page.clock.resume();
  await page.goto(query);
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  await sheet(page).locator('.tab[data-tab=health]').click();
  await expect(sheet(page).locator('.tab[data-tab=health]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('.health .mc')).toHaveCount(4);
}
const range = (page: Page) => sheet(page).locator('.health .nav .rl b');

test('the tab: one person at a time, a card per metric, steps first, then 体重; averages over the days with data', async ({ page }) => {
  await openHealth(page);
  await expect(sheet(page).locator('.health > *').first()).toHaveClass(/who/); // whose data comes first
  await expect(sheet(page).locator('.health .wk')).toHaveCount(0); // no week card: the charts carry the trends
  await expect(sheet(page).locator('.health section.card h3')).toHaveText(['歩数', 'ムーブ', 'エクササイズ', 'スタンド', '体重']);
  await expect(range(page)).toHaveText('10/2–10/31'); // 1か月 = the 30 days to today
  const move = sheet(page).locator('.mc[data-metric=move]');
  await expect(move.locator('.srow')).toHaveCount(1);
  await expect(move.locator('.lab')).toHaveText('1日の平均（記録のある日）');
  await expect(move.locator('.avg')).toHaveText(/^[\d,]+ kcal$/);
  await expect(move.locator('.chg .cv')).toHaveText(/^[↑↓→] [+−±]\d+%$/);
  await expect(move.locator('.sub')).toContainText(/目標 \d+\/\d+日（\d+%）/);
  await expect(move.locator('.sub')).toContainText(/ベスト [\d,]+ kcal（\d+\/\d+）/);
  await expect(sheet(page).locator('.mc[data-metric=steps] header .goal')).toHaveText('目標 8,000歩');
  await expect(sheet(page).locator('.health > .note')).toContainText('100kcal未満');
  // one series: every bar in this phone's person's colour
  await expect(sheet(page).locator('.mc path.bar.pB')).toHaveCount(0);
  expect(await sheet(page).locator('.mc path.bar.pA').count()).toBeGreaterThan(100);
});

test('whose data: this phone’s person by default; switching changes the numbers and the colour and keeps the period and range', async ({ page }) => {
  await openHealth(page, '?demo&as=B');
  const who = (p: string) => sheet(page).locator(`.health .who [data-who=${p}]`);
  await expect(who('B')).toHaveAttribute('aria-pressed', 'true'); // うめ's phone: うめ
  await expect(who('A')).toHaveAttribute('aria-pressed', 'false');
  await expect(sheet(page).locator('.health .who .sb').first()).toHaveAttribute('data-who', 'B'); // me first
  await expect(who('B')).toHaveAttribute('data-sfx', 'none');
  await expect(who('A')).toHaveAttribute('data-sfx', 'tick');
  const steps = sheet(page).locator('.mc[data-metric=steps]');
  await expect(steps).toHaveAttribute('data-person', 'B');
  await expect(steps.locator('path.bar.pA')).toHaveCount(0);
  await sheet(page).locator('[data-period=week]').click();
  await sheet(page).locator('[data-nav=back]').click();
  await expect(range(page)).toHaveText('10/18–10/24');
  const avgB = (await steps.locator('.avg').textContent())!;
  const fill = () => steps.locator('path.bar').first().evaluate((e) => getComputedStyle(e).fill);
  const barB = await fill();
  await who('A').click();
  await expect(who('A')).toHaveAttribute('aria-pressed', 'true');
  await expect(steps).toHaveAttribute('data-person', 'A');
  await expect(steps.locator('path.bar.pB')).toHaveCount(0);
  await expect(steps.locator('path.bar.pA')).not.toHaveCount(0);
  await expect(steps.locator('.avg')).not.toHaveText(avgB);
  expect(await fill()).not.toBe(barB);
  await expect(sheet(page).locator('.wc')).toHaveAttribute('data-person', 'A');
  await expect(sheet(page).locator('.wc').getByRole('img', { name: /^ウェイの体重 / })).toHaveCount(1);
  // the same period and visible range
  await expect(sheet(page).locator('[data-period=week]')).toHaveAttribute('aria-pressed', 'true');
  await expect(range(page)).toHaveText('10/18–10/24');
});

test('a day without data (the Watch on its charger, the phone left home) is a hatched column and 記録なし, not a zero', async ({ page }) => {
  await openHealth(page, '?demo&weeks=60');
  await sheet(page).locator('[data-period=quarter]').click();
  await sheet(page).locator('[data-period=month]').click();
  for (const m of ['move', 'exercise', 'stand', 'steps']) {
    const card = sheet(page).locator(`.mc[data-metric=${m}]`);
    const n = Number((await card.locator('.sub').textContent())!.match(/記録なし (\d+)日/)?.[1] ?? 0);
    await expect(card.locator('rect.none'), m).toHaveCount(n); // one hatched column per day counted as 記録なし
  }
  await expect(sheet(page).locator('.mc .key').first()).toContainText('記録なし');
});

test('period: 1週 by day, 3か月 by week, 1年 by month; ‹ › page through and きょう comes back', async ({ page }) => {
  await openHealth(page);
  const bars = (p: string) => sheet(page).locator(`.mc[data-metric=steps] path.bar.p${p}`);
  await sheet(page).locator('[data-period=week]').click();
  await expect(range(page)).toHaveText('10/25–10/31');
  await expect(bars('A')).toHaveCount(7);
  await sheet(page).locator('[data-period=quarter]').click();
  await expect(sheet(page).locator('.health .nav .rl small')).toHaveText('1週ごとの 1日平均');
  await expect(bars('A')).toHaveCount(9); // 13 weeks, the demo's data in the last 9
  await sheet(page).locator('[data-period=year]').click();
  await expect(range(page)).toHaveText('2025/11–2026/10');
  await sheet(page).locator('[data-period=week]').click();
  const on = sheet(page).locator('[data-nav=on]');
  await expect(on).toHaveAttribute('aria-disabled', 'true'); // nothing after today
  await sheet(page).locator('[data-nav=back]').click();
  await expect(range(page)).toHaveText('10/18–10/24');
  await expect(on).toHaveAttribute('aria-disabled', 'false');
  await sheet(page).locator('[data-nav=back]').click();
  await expect(range(page)).toHaveText('10/11–10/17');
  await on.click();
  await expect(range(page)).toHaveText('10/18–10/24');
  await sheet(page).locator('[data-nav=today]').click();
  await expect(range(page)).toHaveText('10/25–10/31');
  await expect(sheet(page).locator('[data-nav=today]')).toHaveAttribute('aria-disabled', 'true');
});

test('a drag across a chart turns the page (right = older); a short one doesn’t', async ({ page }) => {
  await openHealth(page);
  await sheet(page).locator('[data-period=week]').click();
  const chart = sheet(page).locator('.mc[data-metric=move] .chart');
  await chart.scrollIntoViewIfNeeded();
  const b = (await chart.boundingBox())!;
  const drag = async (dx: number) => {
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2 + dx / 2, b.y + b.height / 2, { steps: 4 });
    await page.mouse.move(b.x + b.width / 2 + dx, b.y + b.height / 2, { steps: 4 });
    await page.mouse.up();
  };
  await drag(24);
  await expect(range(page)).toHaveText('10/25–10/31');
  await drag(120);
  await expect(range(page)).toHaveText('10/18–10/24');
  await drag(-120);
  await expect(range(page)).toHaveText('10/25–10/31');
  await expect(sheet(page).locator('.chart .tip')).toHaveCount(0); // a drag never opens a callout
});

test('a tap on a bar shows that day’s one value (and again closes it)', async ({ page }) => {
  await openHealth(page);
  await sheet(page).locator('[data-period=week]').click();
  const chart = sheet(page).locator('.mc[data-metric=steps] .chart');
  await chart.scrollIntoViewIfNeeded();
  const b = (await chart.boundingBox())!;
  const plotL = 38, plotW = b.width - 38 - 6;
  const at = (i: number) => ({ x: plotL + plotW * ((i + 0.5) / 7), y: b.height - 40 });
  await chart.click({ position: at(5) }); // 10/30
  const tip = chart.locator('.tip');
  await expect(tip).toBeVisible();
  await expect(tip.locator('b')).toHaveText('10月30日(金)');
  await expect(tip.locator('.trow')).toHaveCount(1);
  await expect(tip.locator('.trow')).toHaveText(/^\s*([\d,]+歩\s*(✓)?|記録なし)\s*$/);
  await expect(tip.locator('.trow .dot.pA')).toHaveCount(1);
  // the callout sits inside the chart, on the side away from the bar
  const tb = (await tip.boundingBox())!;
  expect(tb.x).toBeGreaterThanOrEqual(b.x - 1);
  expect(tb.x + tb.width).toBeLessThanOrEqual(b.x + b.width + 1);
  expect(tb.x + tb.width).toBeLessThan(b.x + at(5).x);
  await chart.click({ position: at(5) });
  await expect(tip).toHaveCount(0);
  await chart.click({ position: at(6) }); // today: still running
  await expect(tip.locator('b')).toContainText('きょう（とちゅう）');
  await sheet(page).locator('[data-who=B]').click();
  await expect(tip).toHaveCount(0); // another person closes the callout
});

test('the panel opens on it; it remembers its period and person for the session; its code loads with the panel, not the island', async ({ page }) => {
  const js: string[] = [];
  page.on('response', (r) => r.url().endsWith('.js') && js.push(r.url()));
  await page.goto('?demo');
  const ribbon = page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
  await expect(ribbon).toBeVisible();
  await page.waitForTimeout(500);
  const before = js.length;
  await ribbon.click();
  await expect(sheet(page).locator('.tab[data-tab=health]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('.health .mc')).toHaveCount(4);
  expect(js.length).toBeGreaterThan(before); // its own chunk
  await expect(sheet(page).locator('[data-who=A]')).toHaveAttribute('aria-pressed', 'true');
  await sheet(page).locator('[data-period=quarter]').click();
  await sheet(page).locator('[data-who=B]').click();
  await sheet(page).locator('.titlebar .close').click();
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  await expect(sheet(page).locator('[data-period=quarter]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('[data-who=B]')).toHaveAttribute('aria-pressed', 'true');
  await page.reload(); // a new session: this phone's person again
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  await sheet(page).locator('.tab[data-tab=health]').click();
  await expect(sheet(page).locator('[data-who=A]')).toHaveAttribute('aria-pressed', 'true');
});

for (const [w, h] of [[390, 844], [320, 568]]) {
  test(`${w}x${h}, two years of data: nothing overflows, every control is a thumb’s size, the range row stays put`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await openHealth(page, '?demo&weeks=104');
    for (const per of ['week', 'month', 'quarter', 'year', 'all']) {
      await sheet(page).locator(`[data-period=${per}]`).click();
      const m = await page.evaluate(() => {
        const ctl = [...document.querySelectorAll('dialog[open] .health button')].map((b) => b.getBoundingClientRect());
        const cards = [...document.querySelectorAll('dialog[open] .health section.card')].map((c) => c.getBoundingClientRect());
        const body = document.querySelector('dialog[open] .panel-body')!.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth - innerWidth,
          small: ctl.filter((r) => r.width < 44 || r.height < 44).length,
          outside: cards.filter((r) => r.left < body.left - 1 || r.right > body.right + 1).length
        };
      });
      expect(m, per).toEqual({ overflow: 0, small: 0, outside: 0 });
    }
    // labels on the axis don't collide
    const labels = await sheet(page).locator('.mc[data-metric=steps] svg text').evaluateAll((ts) => ts.map((t) => t.getBoundingClientRect()).filter((r) => r.top > 0));
    const xs = labels.filter((r, _, all) => r.top === Math.max(...all.map((x) => x.top))).sort((a, b) => a.left - b.left);
    for (let i = 1; i < xs.length; i++) expect(xs[i].left).toBeGreaterThanOrEqual(xs[i - 1].right);
    // the range row is still on screen after scrolling down to 体重
    await sheet(page).locator('.wc').scrollIntoViewIfNeeded();
    const nav = (await sheet(page).locator('.health .nav').boundingBox())!;
    const bar = (await sheet(page).locator('.tabs').boundingBox())!;
    expect(nav.y).toBeGreaterThanOrEqual(bar.y + bar.height - 8);
    expect(nav.y).toBeLessThan(bar.y + bar.height + 20);
  });
}
