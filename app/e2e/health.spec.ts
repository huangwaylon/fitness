// けんこう (design.md "Kenkou"): the health popup for the trainer (the HUD's dumbbell). Open it, switch the period,
// page through the history (‹ ›, a drag on a chart, きょう), tap a bar for its numbers, switch whose data (one person
// at a time: whose data in the title bar left of けんこう, the かつどう / からだ switch with the period beside it), each
// goal at its card's upper right (setting them: demo.spec; with no data yet: health-goals.spec, in the gate set), 体's
// pace card (its rules: model/pace.test.ts); on `?demo` and a longer `?demo&weeks=60`, at 390 and 320.
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

test('the tab: one person at a time, a card per metric; かつどう (steps, then the rings) and からだ (体重, 体脂肪率, BMI, 除脂肪体重, 筋肉量, 骨格筋量, 基礎代謝量); averages over every day with data', async ({ page }) => {
  await openHealth(page);
  await expect(periodSel(page)).toHaveValue('week'); // it opens on 1週
  await expect(sheet(page).locator('[data-group=activity]')).toHaveAttribute('aria-pressed', 'true'); // and on かつどう
  await expect(sheet(page).locator('[data-group]')).toHaveText(['活動', '体']);
  await pickPeriod(page, 'month');
  // whose data in the title bar, left of the page switch 健康 | ごはん (centred), ✕ at the right; then one row:
  // かつどう / からだ and the period beside them; then the range row (the header's own checks: kenkou-header.spec)
  const bar = sheet(page).locator('.navbar');
  const [w, ttl, x] = [(await whoSel(page).boundingBox())!, (await bar.locator('nav').boundingBox())!, (await bar.locator('button.close').boundingBox())!];
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
  await expect(whoSel(page)).toHaveAccessibleName('誰のデータ：ウェイ');
  await expect(sheet(page).locator('.health .wk')).toHaveCount(0); // no week card: the charts carry the trends
  await expect(sheet(page).locator('.health section.card h3')).toHaveText(['歩数', 'ムーブ', 'エクササイズ', 'スタンド']);
  await expect(range(page)).toHaveText('10/2〜10/31'); // 1か月 = the 30 days to today
  const move = sheet(page).locator('.mc[data-metric=move]');
  // one stat line (the user 2026-11-19: charts first): the average, its caption, the change as a chip; no key
  await expect(move.locator('.sl')).toHaveCount(1);
  await expect(move.locator('.sl .cap')).toHaveText('1日平均');
  await expect(move.locator('.sl .v')).toHaveText(/^[\d,]+ kcal$/);
  await expect(move.locator('[data-change]')).toHaveText(/^前より [+−±]\d+%$/);
  await expect(move.locator('[data-met]')).toHaveCount(0); // no met-days count: the bars show it
  await expect(move.locator('.key')).toHaveCount(0);
  const line = (await move.locator('.sl').boundingBox())!;
  expect(line.height).toBeLessThan(32); // one line at 393
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
  await expect(sheet(page).locator('.health section.card h3')).toHaveText(['体重のペース', '体重', '体脂肪率', 'BMI', '除脂肪体重', '筋肉量', '骨格筋量', '基礎代謝量']);
  await expect(sheet(page).locator('.health .mc')).toHaveCount(0);
  await expect(periodSel(page)).toHaveValue('month');
  await expect(range(page)).toHaveText('10/2〜10/31');
  await sheet(page).locator('[data-group=activity]').click();
  await expect(sheet(page).locator('.health section.card h3')).toHaveText(['歩数', 'ムーブ', 'エクササイズ', 'スタンド']);
});

test('whose data: this phone’s person by default; switching changes the numbers and the colour and keeps the period and range; the partner’s goals read-only', async ({ page }) => {
  await openHealth(page, '?demo&as=B');
  await expect(whoSel(page)).toHaveValue('B'); // うめ's phone: うめ
  await expect(whoSel(page).locator('option')).toHaveText(['うめ', 'ウェイ']); // me first
  await expect(sheet(page).locator('.navbar .dd.who')).toHaveAttribute('data-who', 'B');
  const steps = sheet(page).locator('.mc[data-metric=steps]');
  await expect(steps).toHaveAttribute('data-person', 'B');
  await expect(steps.locator('path.bar.pA')).toHaveCount(0);
  await expect(steps.locator('button[data-goal]')).toHaveCount(1); // my own goal: a chip to tap
  await pickPeriod(page, 'week');
  await sheet(page).locator('[data-nav=back]').click();
  await expect(range(page)).toHaveText('10/18〜10/24');
  const avgB = (await steps.locator('.sl .v').textContent())!;
  const fill = () => steps.locator('path.bar').first().evaluate((e) => getComputedStyle(e).fill);
  const barB = await fill();
  await pickWho(page, 'A');
  await expect(whoSel(page)).toHaveValue('A');
  await expect(sheet(page).locator('.navbar .dd.who')).toHaveAttribute('data-who', 'A'); // the avatar and swatch follow
  await expect(steps).toHaveAttribute('data-person', 'A');
  await expect(steps.locator('path.bar.pB')).toHaveCount(0);
  await expect(steps.locator('path.bar.pA')).not.toHaveCount(0);
  // the partner's goal: read-only (each sets only their own, 2026-11-24)
  await expect(steps.locator('button[data-goal]')).toHaveCount(0);
  await expect(steps.locator('span[data-goal]')).toHaveCount(1);
  await expect(steps.locator('.sl .v')).not.toHaveText(avgB);
  expect(await fill()).not.toBe(barB);
  await sheet(page).locator('[data-group=body]').click(); // the body cards: still ウェイ's, the same range
  await expect(range(page)).toHaveText('10/18〜10/24');
  await expect(sheet(page).locator('.bc[data-metric=weight]')).toHaveAttribute('data-person', 'A');
  await expect(sheet(page).locator('.bc[data-metric=weight]').getByRole('img', { name: /^ウェイの体重 / })).toHaveCount(1);
  // the same period and visible range
  await expect(periodSel(page)).toHaveValue('week');
  await expect(range(page)).toHaveText('10/18〜10/24');
});

// (a day without the Watch, the Shortcut's Move 0, Exercise 0, Stand 0, is 記録なし as a day with no rows, steps staying:
// model/health.test's noWatch, activityOn and metricStats; a 記録なし day's stub on the chart: the next test)
test('every day with data is its bar, as reported; only a day with no row is a short faint stub on the axis and 記録なし', async ({ page }) => {
  await openHealth(page, '?demo&weeks=60');
  await pickPeriod(page, 'month');
  let stubs = 0;
  for (const m of ['move', 'exercise', 'stand', 'steps']) {
    const card = sheet(page).locator(`.mc[data-metric=${m}]`);
    await expect(card.locator('path.bar').first(), m).toBeVisible();
    const n = await card.locator('rect.none').count(); // a stub per day without a record
    await expect(card.locator('path.bar'), m).toHaveCount(30 - n); // every other day of the 30 is a bar, whatever its value
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
  expect(Math.abs(sb.y + sb.height - (cb.y + cb.height - 24))).toBeLessThanOrEqual(1.5); // on the baseline (1か月: the dates' row alone under it)
  // its tap callout says 記録なし
  await chart.click({ position: { x: sb.x - cb.x + sb.width / 2, y: cb.height - 40 } });
  await expect(chart.locator('.tip .trow')).toHaveText(/^\s*記録なし\s*$/);
});

test('体重: one stat line, the latest (its day, unless the period’s last) and a chip with the 「N日で」 change (the trend line’s, first to last weigh-in of the period); no boxes, no legend', async ({ page }) => {
  await openHealth(page);
  await sheet(page).locator('[data-group=body]').click();
  const card = sheet(page).locator('.bc[data-metric=weight]');
  const line = card.locator('.sl');
  await pickPeriod(page, 'month');
  await line.scrollIntoViewIfNeeded();
  await expect(line).toHaveText(/^\d+\.\d kg \d+\/\d+\s+\d+日で [+−±]\d+\.\d kg 傾向線$/); // (傾向線: the line's toggle at its end)
  await expect(card.locator('[data-stat=latest]')).toHaveText(/^\d+\.\d kg$/);
  await expect(card.locator('[data-stat=since]')).toHaveText(/^[+−±]\d+\.\d kg$/);
  expect((await line.boundingBox())!.height).toBeLessThan(32); // one line
  // 体重: the 傾向線 toggle at the line's right end, the chip beside the stats (the other cards: the chip at the end)
  const [lb, cb, tb] = [(await line.boundingBox())!, (await card.locator('.sl .dc').boundingBox())!, (await card.locator('.sl .wl').boundingBox())!];
  expect(Math.abs(lb.x + lb.width - (tb.x + tb.width))).toBeLessThan(1);
  expect(tb.x - (cb.x + cb.width)).toBeGreaterThan(8);
  const fat = sheet(page).locator('.bc[data-metric=body_fat_pct] .sl');
  const [fb, fc] = [(await fat.boundingBox())!, (await fat.locator('.dc').boundingBox())!];
  expect(Math.abs(fb.x + fb.width - (fc.x + fc.width))).toBeLessThan(1);
  // 1週: the same line over the week's weigh-ins
  await pickPeriod(page, 'week');
  await expect(card.locator('.sl .dc')).toHaveText(/^[1-6]日で /);
  // the goal is said once, on its chip: no boxes, legend, count or basis lines
  await expect(card.locator('.stats, .key, .k-goal, .basis')).toHaveCount(0);
  await expect(card).not.toContainText('回の記録');
  // data only: no coaching or forecast line, no goal words in the chart (the demo's 66.0 kg goal is off the axis)
  await expect(card.locator('.foot, [data-goal-line]')).toHaveCount(0);
  expect((await card.textContent())!.split('目標')).toHaveLength(2); // the chip's, once
  // 10/31 (土) has no weigh-in: its day said; a period ending on a weigh-in: the axis's last label says it, the line doesn't
  await expect(card.locator('[data-stat=date]')).toHaveText('10/30');
  await sheet(page).locator('.health .nav button').first().click(); // ‹ 10/18〜10/24
  await expect(range(page)).toHaveText('10/18〜10/24');
  const last = await card.locator('[data-stat=date]').count();
  expect(last).toBe(0);
});

test('体重のペース: 体’s first card as of today, the 体重 goal’s chip, 推移 ⓘ unfolds how; 体重 draws its line and, today, the projection; never the guest’s', async ({ page }, info) => {
  const how = info.project.name.startsWith('webkit') ? 'tap' : 'click';
  await openHealth(page);
  await sheet(page).locator('[data-group=body]')[how]();
  const card = sheet(page).locator('.health section.card').first();
  await expect(card).toHaveAttribute('data-metric', 'pace');
  await expect(card.locator('h3')).toHaveText('体重のペース');
  await expect(card.locator('button[data-goal=pace-goal]')).toHaveText(/66\.0\skg\s前後/); // the demo's 体重 goal, the same chip
  await expect(card.locator('.pc .h')).not.toBeEmpty();
  const state = await card.locator('[data-pace]').getAttribute('data-pace');
  await expect(card.locator('[data-pace-rate]')).toHaveText(/^[+−±]\d\.\d kg\/週$/);
  await expect(card.locator('[data-pace-progress]')).toHaveText(/^開始から [+−±]\d+\.\d kg · あと \d+\.\d kg$/);
  await expect(card.locator('svg[role=img], .chart')).toHaveCount(0); // no chart: 体重's carries the line
  // 推移 ⓘ: how it's read, and the calculation
  const info_ = card.locator('.sl button.est');
  await expect(info_).toHaveText('推移 ⓘ');
  await info_[how]();
  await expect(info_).toHaveAttribute('aria-expanded', 'true');
  await expect(card.locator('[data-note=pace]')).toContainText('計算');
  // the calculation's line: its rate, or the meals so far and when it starts (never read as worked out from 4 days)
  const calc = (await card.locator('[data-note=pace] > p').allTextContents()).filter((x) => x.startsWith('計算'));
  expect(calc).toHaveLength(1);
  expect(calc[0]).toMatch(/^計算( [+−±]\d\.\d kg\/週（直近7日のうち\d日）|：食事の記録が\d日分。4日分たまると計算します)$/);
  await info_[how]();
  await expect(card.locator('[data-note=pace]')).toHaveCount(0);
  // 体重: the smoothed line; the projection on 1か月 and 3か月 only (never 1週 or 1年), today's range, 順調 or 速め
  const weight = sheet(page).locator('.bc[data-metric=weight]');
  await expect(weight.locator('path[data-trend]')).toHaveCount(1);
  await expect(weight.locator('path[data-ahead], [data-ahead-label]')).toHaveCount(0); // 1週
  const going = state === 'on' || state === 'fast';
  await pickPeriod(page, 'month');
  await expect(weight.locator('path[data-ahead]')).toHaveCount(going ? 1 : 0);
  if (going) {
    // labelled 「2週後の目安」, drawn to the axis's own scale: its end that many weeks past the last weigh-in's dot (a
    // day a bucket), inside the frame's clip that bleeds for the dots
    await expect(weight.locator('[data-ahead-label]')).toHaveText(/^[1-4]週後の目安$/);
    const n = Number((await weight.locator('[data-ahead-label]').textContent())!.match(/\d/)![0]);
    const [days, right, edge] = await weight.locator('svg[role=img]').evaluate((svg) => {
      const r = svg.querySelector('clipPath rect')!, p = svg.querySelector<SVGPathElement>('path[data-ahead]')!;
      const [x1, , x2] = p.getAttribute('d')!.slice(1).split(/[ L]/).map(Number);
      const xs = [...svg.querySelectorAll('circle.dot')].map((c) => +c.getAttribute('cx')!).sort((a, b) => a - b);
      const bw = Math.min(...xs.slice(1).map((x, i) => x - xs[i]).filter((d) => d > 0.5));
      return [(x2 - x1) / bw, p.getBBox().x + p.getBBox().width, +r.getAttribute('x')! + +r.getAttribute('width')! - 4];
    });
    expect(Math.abs(days - 7 * n)).toBeLessThanOrEqual(4);
    expect(right).toBeLessThanOrEqual(edge);
  }
  await pickPeriod(page, 'year');
  await expect(weight.locator('path[data-ahead], [data-ahead-label]')).toHaveCount(0);
  await pickPeriod(page, 'month');
  await sheet(page).locator('.health .nav button').first()[how](); // ‹ the month before
  await expect(weight.locator('path[data-ahead]')).toHaveCount(0);
  await expect(weight.locator('path[data-trend]')).toHaveCount(1);
  await expect(card.locator('.pc .h')).not.toBeEmpty(); // as of today whatever the range
  // the guest's phone: no 体, no pace
  await page.goto('?demo&as=G');
  await page.getByRole('button', { name: 'けんこう', exact: true })[how]();
  await expect(sheet(page).locator('.health .mc')).toHaveCount(4);
  await expect(sheet(page).locator('[data-metric=pace], [data-pace]')).toHaveCount(0);
});

test('体重’s 〰 傾向線: on by default, a tap shows the thin line instead (no trend, no projection), kept across a reload; 体重 alone', async ({ page }, info) => {
  const how = info.project.name.startsWith('webkit') ? 'tap' : 'click';
  await openHealth(page);
  await sheet(page).locator('[data-group=body]')[how]();
  await pickPeriod(page, 'month');
  const weight = sheet(page).locator('.bc[data-metric=weight]');
  const toggle = weight.locator('.sl button[data-weight-line]');
  await expect(toggle).toHaveAttribute('data-weight-line', 'trend');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(toggle).toHaveAccessibleName('体重の傾向線を表示');
  await expect(toggle).toHaveText('傾向線');
  await expect(sheet(page).locator('[data-weight-line]')).toHaveCount(1); // 体脂肪率 and the rest: none
  await expect(sheet(page).locator('.bc[data-metric=body_fat_pct] [data-weight-line]')).toHaveCount(0);
  // at the line's right end, 44 px to tap
  const [t, l] = [(await toggle.boundingBox())!, (await weight.locator('.sl').boundingBox())!];
  expect(l.x + l.width - (t.x + t.width)).toBeLessThan(2);
  const hit = await toggle.evaluate((el) => getComputedStyle(el, '::after').inset);
  expect(hit).toBe('-14px -8px');
  await expect(weight.locator('path[data-trend]')).toHaveCount(1);
  await toggle[how]();
  await expect(toggle).toHaveAttribute('data-weight-line', 'raw');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(weight.locator('path[data-trend], path[data-ahead], [data-ahead-label]')).toHaveCount(0);
  await expect(weight.locator('path.line')).toHaveCount(1);
  // kept on this phone
  await page.reload();
  await page.getByRole('button', { name: 'けんこう', exact: true })[how]();
  await sheet(page).locator('[data-group=body]')[how]();
  await expect(toggle).toHaveAttribute('data-weight-line', 'raw');
  await expect(weight.locator('path[data-trend]')).toHaveCount(0);
  await expect(weight.locator('path.line')).toHaveCount(1);
  await toggle[how]();
  await expect(toggle).toHaveAttribute('data-weight-line', 'trend');
  await expect(weight.locator('path[data-trend]')).toHaveCount(1);
  await expect(weight.locator('path.line')).toHaveCount(0);
});

test('体重のペース’s period line: from 体重’s line, the period’s own words (週平均…先週比, この1か月, 3か月で / 1年で or since the first weigh-in); the pace stays 4 weeks', async ({ page }) => {
  await openHealth(page);
  await sheet(page).locator('[data-group=body]').click();
  const card = sheet(page).locator('.health section.card').first();
  const line = card.locator('[data-pace-period]');
  const rate = await card.locator('[data-pace-rate]').textContent();
  const kg = '[+−±]\\d+\\.\\d kg';
  await expect(line).toHaveText(new RegExp(`^週平均 ${kg}（先週比）$`));
  await pickPeriod(page, 'month');
  await expect(line).toHaveText(new RegExp(`^この1か月 ${kg}$`));
  await pickPeriod(page, 'quarter');
  await expect(line).toHaveText(new RegExp(`^(3か月で|記録を始めて\\d+週間で) ${kg}$`));
  await pickPeriod(page, 'year');
  // (the demo's weeks cover under half a year: since the first weigh-in, or none when the progress line says it)
  if (await line.count()) await expect(line).toHaveText(new RegExp(`^(1年で|記録を始めて\\d+週間で) ${kg}$`));
  await expect(card.locator('[data-pace-rate]')).toHaveText(rate!);
  await expect(card.locator('[data-pace-rate] + span')).toHaveText('（4週）');
});

test('the body cards: each its latest and its change in its unit, its own chart, per person; a tap shows a day', async ({ page }) => {
  await openHealth(page);
  await sheet(page).locator('[data-group=body]').click();
  await pickPeriod(page, 'month');
  const units = { body_fat_pct: /^\d+\.\d%$/, bmi: /^\d+\.\d$/, lean_kg: /^\d+\.\d kg$/ } as const;
  const deltas = { body_fat_pct: /^[+−±]\d+\.\d%$/, bmi: /^[+−±]\d+\.\d$/, lean_kg: /^[+−±]\d+\.\d kg$/ } as const;
  for (const [m, unit] of Object.entries(units) as [keyof typeof units, RegExp][]) {
    const card = sheet(page).locator(`.bc[data-metric=${m}]`);
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveAttribute('data-person', 'A');
    await expect(card.locator('[data-stat=latest]')).toHaveText(unit);
    await expect(card.locator('[data-stat=since]')).toHaveText(deltas[m]);
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
  await expect(range(page)).toHaveText('10/25〜10/31');
  await expect(bars('A')).toHaveCount(7);
  await pickPeriod(page, 'quarter');
  await expect(sheet(page).locator('.health .nav .rl small')).toHaveText('1週ごとの1日平均');
  await expect(bars('A')).toHaveCount(9); // 13 weeks, the demo's data in the last 9
  await pickPeriod(page, 'year');
  await expect(range(page)).toHaveText('2025年11月〜2026年10月');
  await pickPeriod(page, 'week');
  const on = sheet(page).locator('[data-nav=on]');
  await expect(on).toHaveAttribute('aria-disabled', 'true'); // nothing after today
  await sheet(page).locator('[data-nav=back]').click();
  await expect(range(page)).toHaveText('10/18〜10/24');
  await expect(on).toHaveAttribute('aria-disabled', 'false');
  await sheet(page).locator('[data-nav=back]').click();
  await expect(range(page)).toHaveText('10/11〜10/17');
  await on.click();
  await expect(range(page)).toHaveText('10/18〜10/24');
  await sheet(page).locator('[data-nav=today]').click();
  await expect(range(page)).toHaveText('10/25〜10/31');
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
  await expect(range(page)).toHaveText('10/25〜10/31');
  await drag(120);
  await expect(range(page)).toHaveText('10/18〜10/24');
  await drag(-120);
  await expect(range(page)).toHaveText('10/25〜10/31');
  await expect(sheet(page).locator('.chart .tip')).toHaveCount(0); // a drag never opens a callout
});

// The goal a solid line; 1週 with its weekdays under the dates (土 sky, 日 coral: the labels, never the bars).
test('the goal solid; 1週 a weekday under every bar; 1か月 a date a week, no weekdays; none for 3か月', async ({ page }) => {
  await openHealth(page); // 10/31 土
  const card = sheet(page).locator('.mc[data-metric=steps]');
  const wd = card.locator('text.ax.wd');
  await expect(wd).toHaveText(['日', '月', '火', '水', '木', '金', '土']);
  await expect(wd.nth(0)).toHaveClass(/\bsun\b/);
  await expect(wd.nth(6)).toHaveClass(/\bsat\b/);
  await expect(card.locator('text.ax.wd.sat, text.ax.wd.sun')).toHaveCount(2);
  await expect(card.locator('text.ax.now')).toHaveText(['10/31', '土']); // today's date and weekday
  expect(await card.locator('path.goal').evaluate((e) => getComputedStyle(e).strokeDasharray)).toBe('none');
  await expect(card.locator('svg[role=img]')).toHaveAttribute('aria-label', /10月25日（日）〜10月31日（土）/);
  // the weekdays, each under its own bar, never touching
  const boxes = await wd.evaluateAll((ts) => ts.map((t) => { const b = (t as SVGTextElement).getBBox(); return { x: b.x, width: b.width }; }));
  for (let i = 1; i < boxes.length; i++) expect(boxes[i].x).toBeGreaterThan(boxes[i - 1].x + boxes[i - 1].width);
  await pickPeriod(page, 'month');
  await expect(card.locator('text.ax.wd')).toHaveCount(0);
  await expect(card.locator('text[data-x-date]')).toHaveText(['10/3', '10/10', '10/17', '10/24', '10/31']);
  await pickPeriod(page, 'quarter');
  await expect(card.locator('text.ax.wd')).toHaveCount(0);
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
  await expect(tip.locator('b')).toHaveText('10月30日（金）');
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
  await expect(sheet(page).locator('[data-kenkou-tab]')).toHaveText(['健康', 'ごはん']); // a popup of its own: 健康 | ごはん in its title bar
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

for (const [w, h] of [[390, 844], [320, 568]]) {
  test(`${w}x${h}, two years of data: nothing overflows, every control is a thumb’s size, the range row stays put`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await openHealth(page, '?demo&weeks=104');
    for (const per of ['week', 'month', 'quarter', 'year']) for (const g of ['body', 'activity']) {
      await pickPeriod(page, per);
      await sheet(page).locator(`[data-group=${g}]`).click();
      const m = await page.evaluate(() => {
        // (a Segmented pill: 36 drawn, its ::after the 44 hit: ごはん's きろく · グラフ's size; 体's 推定 ⓘ the same way)
        const hit = (b: Element) => {
          const r = b.getBoundingClientRect();
          if (!b.matches('.seg .sb, .est')) return r;
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
  // (the pace card's chip is 体重's)
  await expect(chips).toHaveText(['目標 66.0 kg 前後', '目標 66.0 kg 前後', /^目標(なし| [\d.]+%\s以下)$/, '目標なし', '目標なし', '目標なし', '目標なし']);
  // (基礎代謝量 follows 除脂肪体重: no goal of its own)
  expect(await sheet(page).locator('.health section.card').evaluateAll((cs) => cs.map((c) => c.getAttribute('data-goal-dir')))).toEqual(['target', 'target', 'atMost', 'target', 'atLeast', 'atLeast', 'atLeast', null]);
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
  await expect(lean.locator('path.goal')).toHaveCount(1);
});
