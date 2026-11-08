// けんこう (design.md "Kenkou"): the health popup for the trainer (the HUD's dumbbell). Open it, switch the period,
// page through the history (‹ ›, a drag on a chart, きょう), tap a bar for its numbers, switch whose data (one person
// at a time: whose data in the title bar left of けんこう, the かつどう / からだ switch with the period beside it), each
// goal at its card's upper right (setting them: demo.spec); on `?demo` and a longer `?demo&weeks=60`, at 390 and 320.
import { expect, test, type Page } from './fixtures.ts';

const sheet = (page: Page) => page.locator('dialog[open]');

async function openHealth(page: Page, query = '?demo') {
  await page.clock.install({ time: new Date('2026-10-31T12:10:00+09:00') });
  await page.clock.resume();
  await page.goto(query);
  await page.getByRole('button', { name: 'けんこう', exact: true }).click();
  await expect(sheet(page).locator('.health .mc')).toHaveCount(4);
}
const range = (page: Page) => sheet(page).locator('.health .nav .rl b');
/** The two dropdowns (native selects): whose data in the title bar, the period beside かつどう / からだ. */
const whoSel = (page: Page) => sheet(page).locator('.navbar select[data-pick=who]');
const periodSel = (page: Page) => sheet(page).locator('.health select[data-pick=period]');
const pickPeriod = (page: Page, p: string) => periodSel(page).selectOption(p);
const pickWho = (page: Page, p: string) => whoSel(page).selectOption(p);

test('the tab: one person at a time, a card per metric; かつどう (steps, then the rings) and からだ (体重, 体脂肪率, BMI, 除脂肪体重); averages over every day with data', async ({ page }) => {
  await openHealth(page);
  await expect(periodSel(page)).toHaveValue('week'); // it opens on 1週
  await expect(sheet(page).locator('[data-group=activity]')).toHaveAttribute('aria-pressed', 'true'); // and on かつどう
  await expect(sheet(page).locator('[data-group]')).toHaveText(['活動', '体']);
  await pickPeriod(page, 'month');
  // whose data in the title bar, left of けんこう (centred), ✕ at the right; then one row: かつどう / からだ and the
  // period beside them; then the range row
  const bar = sheet(page).locator('.navbar');
  const [w, ttl, x] = [(await whoSel(page).boundingBox())!, (await bar.locator('h2').boundingBox())!, (await bar.locator('button.close').boundingBox())!];
  await expect(bar.locator('h2')).toHaveText('健康');
  expect(w.x + w.width).toBeLessThanOrEqual(ttl.x + 1); // left of the title
  expect(Math.abs(w.y + w.height / 2 - (ttl.y + ttl.height / 2))).toBeLessThan(4); // one row
  const sheetBox = (await sheet(page).boundingBox())!;
  expect(Math.abs(ttl.x + ttl.width / 2 - (sheetBox.x + sheetBox.width / 2))).toBeLessThan(3); // the title still centred
  expect(x.x).toBeGreaterThan(ttl.x + ttl.width); // ✕ right of it
  await expect(sheet(page).locator('.health > *').first()).toHaveClass(/sel/);
  await expect(sheet(page).locator('.health > .sel > .seg')).toHaveAttribute('aria-label', 'データ');
  await expect(sheet(page).locator('.health > .sel > .seg + .dd select')).toHaveAttribute('data-pick', 'period');
  await expect(sheet(page).locator('.health > .sel + .nav')).toHaveCount(1);
  const [g, p] = [(await sheet(page).locator('[data-group=body]').boundingBox())!, (await periodSel(page).boundingBox())!];
  expect(Math.abs(g.y + g.height / 2 - (p.y + p.height / 2))).toBeLessThan(3); // one row
  expect(p.x).toBeGreaterThan(g.x + g.width - 1);
  expect(Math.min(w.height, p.height)).toBeGreaterThanOrEqual(44);
  // ごはん's parts at ごはん's sizes: the pills its きろく · グラフ's (36 drawn, 44 to tap), the dropdown its グラフ's period
  expect(g.height).toBe(36);
  await expect(sheet(page).locator('.health > .sel > .dd.compact')).toHaveCount(1);
  expect(p.x + p.width).toBeLessThanOrEqual(sheetBox.x + sheetBox.width); // nothing past the edge at 393
  await expect(whoSel(page).locator('option')).toHaveText(['ウェイ', 'うめ']);
  await expect(periodSel(page).locator('option')).toHaveText(['1週', '1か月', '3か月', '1年']);
  await expect(periodSel(page)).toHaveAccessibleName('期間');
  await expect(whoSel(page)).toHaveAccessibleName('誰のデータ');
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
  await expect(sheet(page).locator('.mc[data-metric=steps] header [data-goal]')).toHaveText('目標 8,000歩 以上');
  await expect(sheet(page).locator('.mc header button[data-goal]')).toHaveCount(4); // every card's goal is set there
  await expect(sheet(page).locator('.mc[data-metric=stand] header button[data-goal]')).toHaveText('目標 120分 以上'); // the ring's 120 until set
  // one series: every bar in this phone's person's colour
  await expect(sheet(page).locator('.mc path.bar.pB')).toHaveCount(0);
  expect(await sheet(page).locator('.mc path.bar.pA').count()).toBeGreaterThan(100);
  // からだ: the body cards, the same period and range
  await expect(sheet(page).locator('[data-group=body]')).toHaveAttribute('data-sfx', 'tick');
  await sheet(page).locator('[data-group=body]').click();
  await expect(sheet(page).locator('[data-group=body]')).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).locator('[data-group=body]')).toHaveAttribute('data-sfx', 'none');
  await expect(sheet(page).locator('.health section.card h3')).toHaveText(['体重', '体脂肪率', 'BMI', '除脂肪体重']);
  await expect(sheet(page).locator('.health .mc')).toHaveCount(0);
  await expect(periodSel(page)).toHaveValue('month');
  await expect(range(page)).toHaveText('10/2–10/31');
  await sheet(page).locator('[data-group=activity]').click();
  await expect(sheet(page).locator('.health section.card h3')).toHaveText(['歩数', 'ムーブ', 'エクササイズ', 'スタンド']);
});

test('whose data: this phone’s person by default; switching changes the numbers and the colour and keeps the period and range', async ({ page }) => {
  await openHealth(page, '?demo&as=B');
  await expect(whoSel(page)).toHaveValue('B'); // うめ's phone: うめ
  await expect(whoSel(page).locator('option')).toHaveText(['うめ', 'ウェイ']); // me first
  await expect(sheet(page).locator('.navbar .dd.who')).toHaveAttribute('data-who', 'B');
  const steps = sheet(page).locator('.mc[data-metric=steps]');
  await expect(steps).toHaveAttribute('data-person', 'B');
  await expect(steps.locator('path.bar.pA')).toHaveCount(0);
  await pickPeriod(page, 'week');
  await sheet(page).locator('[data-nav=back]').click();
  await expect(range(page)).toHaveText('10/18–10/24');
  const avgB = (await steps.locator('.avg').textContent())!;
  const fill = () => steps.locator('path.bar').first().evaluate((e) => getComputedStyle(e).fill);
  const barB = await fill();
  await pickWho(page, 'A');
  await expect(whoSel(page)).toHaveValue('A');
  await expect(sheet(page).locator('.navbar .dd.who')).toHaveAttribute('data-who', 'A'); // the avatar and swatch follow
  await expect(steps).toHaveAttribute('data-person', 'A');
  await expect(steps.locator('path.bar.pB')).toHaveCount(0);
  await expect(steps.locator('path.bar.pA')).not.toHaveCount(0);
  await expect(steps.locator('.avg')).not.toHaveText(avgB);
  expect(await fill()).not.toBe(barB);
  await sheet(page).locator('[data-group=body]').click(); // the body cards: still ウェイ's, the same range
  await expect(range(page)).toHaveText('10/18–10/24');
  await expect(sheet(page).locator('.bc[data-metric=weight]')).toHaveAttribute('data-person', 'A');
  await expect(sheet(page).locator('.bc[data-metric=weight]').getByRole('img', { name: /^ウェイの体重 / })).toHaveCount(1);
  // the same period and visible range
  await expect(periodSel(page)).toHaveValue('week');
  await expect(range(page)).toHaveText('10/18–10/24');
});

// (a day without the Watch, the Shortcut's Move 0, Exercise 0, Stand 0, is 記録なし as a day with no rows, steps staying:
// model/health.test's noWatch, activityOn and metricStats; a 記録なし day's stub on the chart: the next test)
test('every day with data is its bar, as reported; only a day with no row is a short faint stub on the axis and 記録なし', async ({ page }) => {
  await openHealth(page, '?demo&weeks=60');
  await pickPeriod(page, 'month');
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
  const card = sheet(page).locator('.bc[data-metric=weight]');
  const chg = card.locator('.chips .chg');
  await pickPeriod(page, 'month');
  await chg.scrollIntoViewIfNeeded();
  // 1か月: the first week's average → the last week's, and per week
  await expect(chg.locator('dt')).toHaveText('期間の変化');
  await expect(chg.locator('.money')).toHaveText(/^[+−±]\d+\.\d kg$/);
  await expect(chg.locator('.basis')).toHaveText('最初の週→最後の週');
  await expect(chg).toContainText(/1週間に [+−±]\d+\.\d kg/);
  // 1週: one week, so the first weigh-in → the last, no weekly pace
  await pickPeriod(page, 'week');
  await expect(chg.locator('.basis')).toHaveText('最初→最後の記録');
  await expect(chg).not.toContainText('1週間に');
  await expect(card).not.toContainText('ながれ');
  await expect(card.locator('.note')).toHaveCount(0);
});

test('the body cards: each its average, count and plain change in its unit, its own chart, per person; a tap shows a day', async ({ page }) => {
  await openHealth(page);
  await sheet(page).locator('[data-group=body]').click();
  await pickPeriod(page, 'month');
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
  await pickWho(page, 'B');
  await expect(fat).toHaveAttribute('data-person', 'B');
  await expect(fat.locator('circle.dot.pA')).toHaveCount(0);
  expect(await fat.locator('circle.dot.pB').count()).toBeGreaterThan(15);
});

test('period: 1週 by day, 3か月 by week, 1年 by month; ‹ › page through and きょう comes back', async ({ page }) => {
  await openHealth(page);
  const bars = (p: string) => sheet(page).locator(`.mc[data-metric=steps] path.bar.p${p}`);
  await pickPeriod(page, 'week');
  await expect(range(page)).toHaveText('10/25–10/31');
  await expect(bars('A')).toHaveCount(7);
  await pickPeriod(page, 'quarter');
  await expect(sheet(page).locator('.health .nav .rl small')).toHaveText('1週ごとの1日平均');
  await expect(bars('A')).toHaveCount(9); // 13 weeks, the demo's data in the last 9
  await pickPeriod(page, 'year');
  await expect(range(page)).toHaveText('2025/11–2026/10');
  await pickPeriod(page, 'week');
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
  await pickPeriod(page, 'week');
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
  await pickPeriod(page, 'week');
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
  await expect(tip.locator('b')).toContainText('今日（途中）');
  await pickWho(page, 'B');
  await expect(tip).toHaveCount(0); // another person closes the callout
});

// Today's bar (still running: outlined dashed) is drawn by the goal as every day is: pale while under it, solid once
// it's met (it was pale all day, 未達成 at 9.7k against 8,000).
test('today’s bar turns solid (達成) once its goal is met, pale under it', async ({ page }) => {
  await openHealth(page);
  await pickPeriod(page, 'week');
  const steps = sheet(page).locator('.mc[data-metric=steps]');
  const now = steps.locator('path.bar.now');
  const fill = () => now.evaluate((e) => Number(getComputedStyle(e).fillOpacity).toFixed(2));
  const goal = async (v: string) => {
    await steps.locator('button[data-goal]').click();
    await steps.locator('form.tray').getByRole('textbox').fill(v);
    await steps.locator('form.tray').getByRole('button', { name: '決定' }).click();
    await expect(steps.locator('form.tray')).toHaveCount(0);
  };
  await goal('1000');
  await expect.poll(fill).toBe('1.00');
  await goal('30000');
  await expect.poll(fill).toBe('0.34');
  await expect(steps.locator('[data-goal-line]')).toHaveCount(0); // the goal's words: the chip and the legend, not the plot
});

test('the dumbbell opens it at 1週, every time; whose data is kept for the session; its code loads with the popup, not the island', async ({ page }) => {
  const js: string[] = [];
  page.on('response', (r) => r.url().endsWith('.js') && js.push(r.url()));
  await page.goto('?demo');
  const bell = page.getByRole('button', { name: 'けんこう', exact: true });
  await expect(bell).toBeVisible();
  await page.waitForTimeout(500); // the island's own chunks have loaded (proving none follow is the point)
  const before = js.length;
  await bell.click();
  await expect(sheet(page).locator('.health .mc')).toHaveCount(4);
  await expect(sheet(page).locator('[data-kenkou-tab]')).toHaveText(['健康', 'ごはん']); // a popup of its own: 健康 and ごはん's tabs
  await expect(sheet(page).locator('h2')).toHaveText('健康');
  expect(js.length).toBeGreaterThan(before); // its own chunk
  await expect(whoSel(page)).toHaveValue('A');
  await pickPeriod(page, 'quarter');
  await sheet(page).locator('[data-group=body]').click();
  await pickWho(page, 'B');
  await sheet(page).locator('.titlebar .close').click();
  await expect(sheet(page)).toHaveCount(0);
  await bell.click();
  await expect(periodSel(page)).toHaveValue('week');
  await expect(sheet(page).locator('[data-group=activity]')).toHaveAttribute('aria-pressed', 'true'); // かつどう again
  await expect(whoSel(page)).toHaveValue('B');
  await page.keyboard.press('Escape'); // Esc closes it too
  await expect(sheet(page)).toHaveCount(0);
  await page.reload(); // a new session: this phone's person again
  await page.getByRole('button', { name: 'けんこう', exact: true }).click();
  await expect(whoSel(page)).toHaveValue('A');
});

test('no Health data yet (a new couple): every card is there with its goal, saying so; the goals set from it', async ({ page }) => {
  await openHealth(page, '?demo&health=none');
  const cards = sheet(page).locator('.health section.card');
  await expect(cards.locator('h3')).toHaveText(['歩数', 'ムーブ', 'エクササイズ', 'スタンド']);
  await expect(cards.locator('[data-health-empty]')).toHaveCount(4);
  await expect(cards.locator('[data-health-empty]').first()).toHaveText('まだ記録がありません');
  await expect(sheet(page).locator('.health svg[role=img]')).toHaveCount(0); // no empty charts
  const steps = sheet(page).locator('button[data-goal=steps-goal]');
  await expect(steps).toHaveText(/8,000歩\s以上/);
  await steps.click();
  await sheet(page).locator('#goal-steps-goal [data-goal-step="1"]').click();
  await sheet(page).locator('#goal-steps-goal button[type=submit]').click();
  await expect(steps).toHaveText(/8,500歩\s以上/);
  await sheet(page).locator('[data-group=body]').click();
  await expect(cards.locator('[data-health-empty]')).toHaveCount(4);
  await expect(sheet(page).locator('button[data-goal=weight-goal]')).toHaveText(/66\.0\skg\s前後/); // the demo's goal, kept without a weigh-in
  await expect(sheet(page).locator('button[data-goal=body_fat_pct-goal]')).toBeVisible();
});

for (const [w, h] of [[390, 844], [320, 568]]) {
  test(`${w}x${h}, two years of data: nothing overflows, every control is a thumb’s size, the range row stays put`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await openHealth(page, '?demo&weeks=104');
    for (const per of ['week', 'month', 'quarter', 'year']) for (const g of ['body', 'activity']) {
      await pickPeriod(page, per);
      await sheet(page).locator(`[data-group=${g}]`).click();
      const m = await page.evaluate(() => {
        // (a Segmented pill: 36 drawn, its ::after the 44 hit: ごはん's きろく · グラフ's size)
        const hit = (b: Element) => {
          const r = b.getBoundingClientRect();
          if (!b.matches('.seg .sb')) return r;
          const a = getComputedStyle(b, '::after');
          return { width: r.width - 2 * parseFloat(a.left), height: r.height - 2 * parseFloat(a.top) };
        };
        const ctl = [...document.querySelectorAll('dialog[open] .health :is(button, select)')].map(hit);
        const cards = [...document.querySelectorAll('dialog[open] .health section.card')].map((c) => c.getBoundingClientRect());
        const body = document.querySelector('dialog[open] [data-health-sheet]')!.getBoundingClientRect();
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
      const bar = (await sheet(page).locator('.titlebar').boundingBox())!;
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

test('every chart has its goal: a chip at the card’s upper right with its direction, set in place, the chart’s label worded the same way', async ({ page }) => {
  await openHealth(page);
  const chips = sheet(page).locator('.health section.card > header button[data-goal]');
  await expect(chips).toHaveText(['目標 8,000歩 以上', '目標 600 kcal 以上', '目標 60分 以上', '目標 120分 以上']);
  expect(await sheet(page).locator('.health section.card').evaluateAll((cs) => cs.map((c) => c.getAttribute('data-goal-dir')))).toEqual(['atLeast', 'atLeast', 'atLeast', 'atLeast']);
  // Exercise: per person from today on; the ベル still go by the fixed 60 (the editor says so)
  const ex = sheet(page).locator('.mc[data-metric=exercise]');
  await ex.locator('button[data-goal]').click();
  await expect(ex.locator('form.tray')).toContainText('エクササイズの目標（1日）');
  await expect(ex.locator('form.tray')).toContainText('ベルは60分のまま');
  await ex.locator('form.tray').getByRole('textbox').fill('33');
  await ex.locator('form.tray').getByRole('button', { name: '決定' }).click();
  await expect(ex.locator('form.tray').getByRole('textbox')).toHaveAttribute('aria-invalid', 'true'); // in 5s
  await ex.locator('form.tray').getByRole('textbox').fill('30');
  await ex.locator('form.tray').getByRole('button', { name: '決定' }).click();
  await expect(ex.locator('button[data-goal]')).toHaveText('目標 30分 以上');
  await expect(sheet(page).getByRole('status')).toContainText('エクササイズの目標を変更しました');
  await expect(ex.locator('[data-goal-line]')).toHaveCount(0); // its words: the chip's, never over the bars
  await expect(ex.locator('svg[role=img]')).toHaveAttribute('aria-label', /目標 30分\s以上/);
  // からだ: each its own, its direction (weight and BMI near a value, body fat at most, lean mass at least)
  await sheet(page).locator('[data-group=body]').click();
  await expect(chips).toHaveText(['目標 66.0 kg 前後', /^目標(なし| [\d.]+%\s以下)$/, '目標なし', '目標なし']);
  expect(await sheet(page).locator('.health section.card').evaluateAll((cs) => cs.map((c) => c.getAttribute('data-goal-dir')))).toEqual(['target', 'atMost', 'target', 'atLeast']);
  const bmi = sheet(page).locator('.bc[data-metric=bmi]');
  await bmi.locator('button[data-goal]').click();
  await expect(bmi.locator('form.tray')).toContainText('目標BMI');
  await bmi.locator('form.tray').getByRole('textbox').fill('22');
  await bmi.locator('form.tray').getByRole('button', { name: '決定' }).click();
  await expect(bmi.locator('button[data-goal]')).toHaveText('目標 22.0 前後');
  const lean = sheet(page).locator('.bc[data-metric=lean_kg]');
  await lean.locator('button[data-goal]').click();
  await lean.locator('form.tray').getByRole('textbox').fill('52.5');
  await lean.locator('form.tray').getByRole('button', { name: '決定' }).click();
  await expect(lean.locator('button[data-goal]')).toHaveText('目標 52.5 kg 以上');
  await expect(lean.locator('.key .k-goal')).toHaveCount(1);
});
