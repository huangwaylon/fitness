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

test('the tab: one person at a time, a card per metric; かつどう (steps, then the rings) and からだ (体重, 体脂肪率, BMI, 除脂肪体重); averages over every day with data', async ({ page }) => {
  await openHealth(page);
  await expect(sheet(page).locator('[data-period=week]')).toHaveAttribute('aria-pressed', 'true'); // it opens on 1週
  await expect(sheet(page).locator('[data-group=activity]')).toHaveAttribute('aria-pressed', 'true'); // and on かつどう
  await expect(sheet(page).locator('[data-group]')).toHaveText(['かつどう', 'からだ']);
  await sheet(page).locator('[data-period=month]').click();
  await expect(sheet(page).locator('.health > *').first()).toHaveClass(/who/); // whose data comes first
  await expect(sheet(page).locator('.health > .seg').nth(2)).toHaveAttribute('aria-label', 'どの データ'); // the group right under the period
  await expect(sheet(page).locator('.health > .seg').nth(2).locator('xpath=following-sibling::*[1]')).toHaveClass(/nav/);
  await expect(sheet(page).locator('.health .wk')).toHaveCount(0); // no week card: the charts carry the trends
  await expect(sheet(page).locator('.health section.card h3')).toHaveText(['歩数', 'ムーブ', 'エクササイズ', 'スタンド']);
  await expect(range(page)).toHaveText('10/2–10/31'); // 1か月 = the 30 days to today
  const move = sheet(page).locator('.mc[data-metric=move]');
  await expect(move.locator('.srow')).toHaveCount(1);
  await expect(move.locator('.lab')).toHaveText('1日の平均');
  await expect(move.locator('.avg')).toHaveText(/^[\d,]+ kcal$/);
  await expect(move.locator('.chg .cv')).toHaveText(/^[↑↓→] [+−±]\d+%$/);
  await expect(move.locator('.sub')).toContainText(/目標 \d+\/\d+日（\d+%）/);
  await expect(move.locator('.sub')).toContainText(/ベスト [\d,]+ kcal（\d+\/\d+）/);
  await expect(sheet(page).locator('.mc[data-metric=steps] header .goal')).toHaveText('目標 8,000歩');
  await expect(sheet(page).locator('.health > .note')).toContainText('数字を そのまま');
  // one series: every bar in this phone's person's colour
  await expect(sheet(page).locator('.mc path.bar.pB')).toHaveCount(0);
  expect(await sheet(page).locator('.mc path.bar.pA').count()).toBeGreaterThan(100);
  // からだ: the body cards, the same period and range; no activity footnote
  await expect(sheet(page).locator('[data-group=body]')).toHaveAttribute('data-sfx', 'tick');
  await sheet(page).locator('[data-group=body]').click();
  await expect(sheet(page).locator('[data-group=body]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('[data-group=body]')).toHaveAttribute('data-sfx', 'none');
  await expect(sheet(page).locator('.health section.card h3')).toHaveText(['体重', '体脂肪率', 'BMI', '除脂肪体重']);
  await expect(sheet(page).locator('.health .mc')).toHaveCount(0);
  await expect(sheet(page).locator('[data-period=month]')).toHaveAttribute('aria-pressed', 'true');
  await expect(range(page)).toHaveText('10/2–10/31');
  await expect(sheet(page).locator('.health > .note')).toHaveCount(0);
  await sheet(page).locator('[data-group=activity]').click();
  await expect(sheet(page).locator('.health section.card h3')).toHaveText(['歩数', 'ムーブ', 'エクササイズ', 'スタンド']);
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
  await sheet(page).locator('[data-group=body]').click(); // the body cards: still ウェイ's, the same range
  await expect(range(page)).toHaveText('10/18–10/24');
  await expect(sheet(page).locator('.wc')).toHaveAttribute('data-person', 'A');
  await expect(sheet(page).locator('.wc').getByRole('img', { name: /^ウェイの体重 / })).toHaveCount(1);
  // the same period and visible range
  await expect(sheet(page).locator('[data-period=week]')).toHaveAttribute('aria-pressed', 'true');
  await expect(range(page)).toHaveText('10/18–10/24');
});

test('every day with data is its bar, as reported; only a day with no row is a short faint stub on the axis and 記録なし', async ({ page }) => {
  await openHealth(page, '?demo&weeks=60');
  await sheet(page).locator('[data-period=month]').click();
  let stubs = 0;
  for (const m of ['move', 'exercise', 'stand', 'steps']) {
    const card = sheet(page).locator(`.mc[data-metric=${m}]`);
    const n = Number((await card.locator('.sub').textContent())!.match(/記録なし (\d+)日/)?.[1] ?? 0);
    await expect(card.locator('rect.none'), m).toHaveCount(n); // one stub per day counted as 記録なし
    await expect(card.locator('path.bar'), m).toHaveCount(30 - n); // every other day of the 30 is a bar, whatever its value
    if (n) await expect(card.locator('.key'), m).toContainText('記録なし');
    else await expect(card.locator('.key'), m).not.toContainText('記録なし'); // the swatch only when the period has such a day
    stubs += n;
  }
  expect(stubs).toBeGreaterThan(0);
  // a stub sits on the axis and stays short (never a column that reads as a value)
  const card = sheet(page).locator('.mc').filter({ has: page.locator('rect.none') }).first();
  const stub = card.locator('rect.none').first();
  const chart = card.locator('.chart');
  await chart.scrollIntoViewIfNeeded();
  const [sb, cb] = [(await stub.boundingBox())!, (await chart.boundingBox())!];
  expect(sb.height).toBeLessThanOrEqual(8);
  expect(Math.abs(sb.y + sb.height - (cb.y + cb.height - 24))).toBeLessThanOrEqual(1.5); // on the baseline
  // its tap callout says 記録なし
  await chart.click({ position: { x: sb.x - cb.x + sb.width / 2, y: cb.height - 40 } });
  await expect(chart.locator('.tip .trow')).toHaveText(/^\s*記録なし\s*$/);
});

test('体重: the period’s plain change (first week → last week, else first → last weigh-in), no trend words', async ({ page }) => {
  await openHealth(page);
  await sheet(page).locator('[data-group=body]').click();
  const card = sheet(page).locator('.wc');
  const chg = card.locator('.chips .chg');
  await sheet(page).locator('[data-period=month]').click();
  await chg.scrollIntoViewIfNeeded();
  // 1か月: the first week's average → the last week's, and per week
  await expect(chg.locator('dt')).toHaveText('期間の変化');
  await expect(chg.locator('.money')).toHaveText(/^[+−±]\d+\.\d kg$/);
  await expect(chg.locator('.basis')).toHaveText('最初の週→最後の週');
  await expect(chg).toContainText(/1週間に [+−±]\d+\.\d kg/);
  // 1週: one week, so the first weigh-in → the last, no weekly pace
  await sheet(page).locator('[data-period=week]').click();
  await expect(chg.locator('.basis')).toHaveText('最初→最後の記録');
  await expect(chg).not.toContainText('1週間に');
  await expect(card).not.toContainText('ながれ');
  await expect(card.locator('.note')).toHaveCount(0);
});

test('the body cards: each its average, count and plain change in its unit, its own chart, per person; a tap shows a day', async ({ page }) => {
  await openHealth(page);
  await sheet(page).locator('[data-group=body]').click();
  await sheet(page).locator('[data-period=month]').click();
  const units = { body_fat_pct: /^\d+\.\d%$/, bmi: /^\d+\.\d$/, lean_kg: /^\d+\.\d kg$/ } as const;
  const deltas = { body_fat_pct: /^[+−±]\d+\.\d%$/, bmi: /^[+−±]\d+\.\d$/, lean_kg: /^[+−±]\d+\.\d kg$/ } as const;
  for (const [m, unit] of Object.entries(units) as [keyof typeof units, RegExp][]) {
    const card = sheet(page).locator(`.bc[data-metric=${m}]`);
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveAttribute('data-person', 'A');
    await expect(card.locator('.chips > div').first().locator('.money')).toHaveText(unit);
    await expect(card.locator('.chips .n').first()).toHaveText(/^\d+回の記録$/);
    await expect(card.locator('.chg .money')).toHaveText(deltas[m]);
    await expect(card.locator('.chg .basis')).toHaveText('最初の週→最後の週');
    expect(await card.locator('circle.dot.pA').count()).toBeGreaterThan(15);
    await expect(card.getByRole('img', { name: new RegExp(`^ウェイの${await card.locator('h3').textContent()} `) })).toHaveCount(1);
  }
  // a tap on the last day's dot: that day's value in the callout
  const fat = sheet(page).locator('.bc[data-metric=body_fat_pct]');
  const chart = fat.locator('.chart');
  const dot = await fat.locator('circle.dot').last().boundingBox();
  const cb = (await chart.boundingBox())!;
  await chart.click({ position: { x: dot!.x - cb.x + dot!.width / 2, y: cb.height / 2 } });
  await expect(chart.locator('.tip .money')).toHaveText(units.body_fat_pct);
  // うめ's: her colour and numbers
  await sheet(page).locator('.health .who [data-who=B]').click();
  await expect(fat).toHaveAttribute('data-person', 'B');
  await expect(fat.locator('circle.dot.pA')).toHaveCount(0);
  expect(await fat.locator('circle.dot.pB').count()).toBeGreaterThan(15);
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

test('the panel opens on it at 1週, every time from the ribbon; whose data is kept for the session; its code loads with the panel, not the island', async ({ page }) => {
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
  await sheet(page).locator('[data-group=body]').click();
  await sheet(page).locator('[data-who=B]').click();
  await sheet(page).locator('.titlebar .close').click();
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  await expect(sheet(page).locator('.tab[data-tab=health]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('[data-period=week]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('[data-group=activity]')).toHaveAttribute('aria-pressed', 'true'); // かつどう again
  await expect(sheet(page).locator('[data-who=B]')).toHaveAttribute('aria-pressed', 'true');
  await sheet(page).locator('.tab[data-tab=kiroku]').click(); // another tab, closed: the next opening is けんこう again
  await sheet(page).locator('.titlebar .close').click();
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  await expect(sheet(page).locator('.tab[data-tab=health]')).toHaveAttribute('aria-pressed', 'true');
  await page.reload(); // a new session: this phone's person again
  await page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ }).click();
  await sheet(page).locator('.tab[data-tab=health]').click();
  await expect(sheet(page).locator('[data-who=A]')).toHaveAttribute('aria-pressed', 'true');
});

for (const [w, h] of [[390, 844], [320, 568]]) {
  test(`${w}x${h}, two years of data: nothing overflows, every control is a thumb’s size, the range row stays put`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await openHealth(page, '?demo&weeks=104');
    for (const per of ['week', 'month', 'quarter', 'year']) for (const g of ['body', 'activity']) {
      await sheet(page).locator(`[data-period=${per}]`).click();
      await sheet(page).locator(`[data-group=${g}]`).click();
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
      expect(m, `${per} ${g}`).toEqual({ overflow: 0, small: 0, outside: 0 });
    }
    // labels on the axis don't collide
    const labels = await sheet(page).locator('.mc[data-metric=steps] svg text').evaluateAll((ts) => ts.map((t) => t.getBoundingClientRect()).filter((r) => r.top > 0));
    const xs = labels.filter((r, _, all) => r.top === Math.max(...all.map((x) => x.top))).sort((a, b) => a.left - b.left);
    for (let i = 1; i < xs.length; i++) expect(xs[i].left).toBeGreaterThanOrEqual(xs[i - 1].right);
    // the range row is still on screen after scrolling down to スタンド, and on からだ to 除脂肪体重
    const navPut = async () => {
      const nav = (await sheet(page).locator('.health .nav').boundingBox())!;
      const bar = (await sheet(page).locator('.tabs').boundingBox())!;
      expect(nav.y).toBeGreaterThanOrEqual(bar.y + bar.height - 8);
      expect(nav.y).toBeLessThan(bar.y + bar.height + 20);
    };
    await sheet(page).locator('.mc[data-metric=stand]').scrollIntoViewIfNeeded();
    await navPut();
    await sheet(page).locator('[data-group=body]').click();
    await sheet(page).locator('.bc[data-metric=lean_kg]').scrollIntoViewIfNeeded();
    await navPut();
  });
}
