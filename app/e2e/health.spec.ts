// けんこう (design.md "Kenkou"): the panel's Health tab for the trainer. Open it, switch the period, page through the
// history (‹ ›, a drag on a chart, きょう), tap a bar for its numbers, one person or both; on `?demo` and a longer
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

test('the tab: a card per metric in the app’s order, then 体重; averages over the days with data', async ({ page }) => {
  await openHealth(page);
  await expect(sheet(page).locator('.health section.card:not(.wk) h3')).toHaveText(['ムーブ', 'エクササイズ', 'スタンド', '歩数', '体重']);
  await expect(range(page)).toHaveText('10/2–10/31'); // 1か月 = the 30 days to today
  const move = sheet(page).locator('.mc[data-metric=move]');
  await expect(move.locator('.shead')).toContainText('1日の平均（記録のある日）');
  for (const p of ['A', 'B']) {
    const row = move.locator(`.srow[data-person=${p}]`);
    await expect(row.locator('.avg')).toHaveText(/^[\d,]+ kcal$/);
    await expect(row.locator('.chg')).toHaveText(/^[↑↓→] [+−±]\d+%$/);
    await expect(row.locator('.sub')).toContainText(/目標 \d+\/\d+日（\d+%）/);
    await expect(row.locator('.sub')).toContainText(/ベスト [\d,]+ kcal（\d+\/\d+）/);
  }
  await expect(sheet(page).locator('.mc[data-metric=steps] header .goal')).toHaveText('目標 8,000歩');
  await expect(sheet(page).locator('.health > .note')).toContainText('ウォッチを つけていない日');
});

test('今週と 先週: the trainer card at the top, both of us, calendar weeks, this week so far = its finished days', async ({ page }) => {
  await openHealth(page); // Saturday 10/31: five days finished
  const card = sheet(page).locator('.health > .wk');
  await expect(sheet(page).locator('.health > *').first()).toHaveClass(/wk/); // above the controls and the charts
  await expect(card.locator('h3')).toHaveText('今週と 先週');
  await expect(card.locator('.span')).toHaveText('今週 10/26–11/1・先週 10/19–10/25');
  await expect(card.locator('.pb')).toHaveCount(2);
  for (const p of ['A', 'B']) {
    const t = card.locator(`.pb[data-person=${p}]`);
    await expect(t.locator('thead th')).toHaveText(['今週（5日）', '先週', 'くらべて', '目標']);
    await expect(t.locator('tbody tr')).toHaveCount(5);
    await expect(t.locator('tbody th')).toContainText(['ムーブ', 'エクササイズ', 'スタンド', '歩数', '体重']);
    await expect(t.locator('tr[data-metric=steps] td').nth(0)).toHaveText(/^[\d,]+$/);
    await expect(t.locator('tr[data-metric=steps] td').nth(2)).toHaveText(/^[↑↓→][+−±]\d+%$/);
    await expect(t.locator('tr[data-metric=steps] td').nth(3)).toHaveText(/^[0-5]\/[1-5]$/);
    await expect(t.locator('tr[data-metric=weight] td').nth(2)).toHaveText(/^[+−±]\d+\.\d$|^–$/);
  }
  // it doesn't follow the period below
  await sheet(page).locator('[data-period=year]').click();
  await expect(card.locator('.span')).toHaveText('今週 10/26–11/1・先週 10/19–10/25');
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

test('a tap on a bar shows that day for both of us (and again closes it); one person shows one', async ({ page }) => {
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
  await expect(tip.locator('.trow')).toHaveCount(2);
  await expect(tip.locator('.trow').first()).toContainText(/ウェイ\s*[\d,]+歩/);
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
  await expect(sheet(page).locator('.mc[data-metric=steps] .srow')).toHaveCount(1);
  await expect(sheet(page).locator('.mc[data-metric=steps] path.bar.pA')).toHaveCount(0);
  await expect(sheet(page).locator('.wc .person')).toHaveCount(1);
});

test('the tab remembers its period for the session, and its code loads only with the tab', async ({ page }) => {
  const js: string[] = [];
  page.on('response', (r) => r.url().endsWith('.js') && js.push(r.url()));
  await page.goto('?demo');
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  await expect(sheet(page).locator('.kiroku')).toBeVisible();
  const before = js.length;
  await sheet(page).locator('.tab[data-tab=health]').click();
  await expect(sheet(page).locator('.health .mc')).toHaveCount(4);
  expect(js.length).toBeGreaterThan(before); // its own chunk
  await sheet(page).locator('[data-period=quarter]').click();
  await sheet(page).locator('.titlebar .close').click();
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  await expect(sheet(page).locator('[data-period=quarter]')).toHaveAttribute('aria-pressed', 'true');
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
