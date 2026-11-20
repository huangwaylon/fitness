// Night's text contrast (docs/design.md "Text colours by surface"): at night (22:00) the theme's text is cream for the
// navy chrome, so an always-cream surface (a card, a stage, a game sheet) whose text inherits it reads cream on cream
// (~1.1:1) unless it carries .obj-cream and its own colour; a day-only ink on the themed navy reads ~1.3:1. Each test
// opens sheets at night and holds every visible text at 3:1 or more on what it sits on (e2e/contrast.ts). The logic tier.
import { expect, test, type Page } from './fixtures.ts';
import { islandUp, tapBoard } from './island.ts';
import { fromMenu, openKenkou } from './hud.ts';
import { lowContrast } from './contrast.ts';
import { fakeYoutube } from './youtube.ts';

test.use({ viewport: { width: 393, height: 659 } });
const NIGHT = '?demo&date=2026-11-04T22:00';

/** The texts under 3:1 now (a gradient or a filter on the way down: the background a guess, left out). */
async function low(page: Page) {
  await expect(page.locator('html')).toHaveAttribute('data-tod', 'night');
  // (each finite animation at its end: a score's bump flashes gold for a moment)
  await page.evaluate(() => document.getAnimations().forEach((a) => a.effect?.getComputedTiming().iterations !== Infinity && a.finish()));
  const lows = await lowContrast(page);
  return lows.filter((l) => !l.flags.some((f) => f === 'img' || f === 'filter')).map((l) => `${l.ratio}:1 ${l.fg} on ${l.bg} “${l.text}” ${l.sel}`);
}

/** WebKit taps (the phones' input), Chromium clicks. */
const howOf = (name: string) => (name.startsWith('webkit') ? 'tap' : 'click') as 'tap' | 'click';

async function island(page: Page) {
  await page.goto(NIGHT);
  await islandUp(page);
}

test('the menu’s sheets read at night', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await island(page);
  for (const which of ['bells', 'english', 'travel', 'wedding', 'hiking', 'settings'] as const) {
    await fromMenu(page, which, how);
    expect(await low(page), which).toEqual([]);
    await page.locator('dialog[open]').getByRole('button', { name: '閉じる' }).first()[how]();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  }
});

test('けんこう and ごはん read at night', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await island(page);
  await openKenkou(page, 'health');
  expect(await low(page), 'health').toEqual([]);
  // a met day's callout: cream at every hour, so its ✓ keeps the day's green (the night's light one reads 1.3:1 there;
  // a lone symbol and a pointer-events: none callout are both outside low()'s walk)
  const chart = page.locator('dialog[open] .mc[data-metric=steps] .chart');
  const b = (await chart.boundingBox())!;
  await chart[how]({ position: { x: 38 + (b.width - 44) * (1.5 / 7), y: b.height - 40 } }); // 10/30, 12.7k of 8,000
  await expect(chart.locator('.tip .ok')).toHaveCSS('color', 'rgb(37, 110, 51)');
  await chart[how]({ position: { x: 38 + (b.width - 44) * (1.5 / 7), y: b.height - 40 } }); // (the callout closed)
  // 体: the stat lines' chips, the footnotes, the quiet goal chips and an open goal tray
  await page.locator('dialog[open] [data-group=body]')[how]();
  await page.locator('dialog[open] .bc[data-metric=weight] button[data-goal]')[how]();
  await expect(page.locator('dialog[open] form.tray')).toBeVisible();
  expect(await low(page), 'body').toEqual([]);
  await page.locator('dialog[open] form.tray .btn.paper')[how]();
  const food = page.locator('dialog[open] [data-kenkou-tab=food]');
  await food[how]();
  await expect(food).toHaveAttribute('aria-current', 'page');
  expect(await low(page), 'food').toEqual([]);
  // グラフ: the average card and the cards' stat lines
  await page.locator('dialog[open] [data-tab=chart]')[how]();
  await expect(page.locator('dialog[open] [data-food-avg]')).toBeVisible();
  expect(await low(page), 'food chart').toEqual([]);
});

test('the look’s cream stage keeps the day’s text at night (its 回せます and the strip’s kind)', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await island(page);
  await fromMenu(page, 'settings', how);
  // (姿's 変更)
  await page.locator('dialog[open] [data-push=look]')[how]();
  // (コーデ: the stage with no colour dots, 回せます at its foot)
  await page.locator('[data-look-tab="coord"]')[how]();
  const stage = page.locator('[data-look-stage]');
  await expect(stage.locator('.hint')).toBeVisible();
  expect(await stage.evaluate((el) => getComputedStyle(el).color)).toBe('rgb(74, 58, 44)');
  expect(await low(page)).toEqual([]);
});

test('/speech: the page and its kit cards follow the hour', async ({ page }) => {
  await page.goto(`speech${NIGHT}`);
  await expect(page.locator('[data-speech] .card').first()).toBeVisible();
  expect(await low(page)).toEqual([]);
});

test('英語すごろく’s results read at night (the team’s stars and かいがら on the navy card)', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await island(page);
  await fromMenu(page, 'english', how);
  await page.locator('dialog[open] [data-en-tab="game"]')[how]();
  const sh = page.locator('[data-sugoroku]');
  await sh.locator('[data-sg-new]')[how]();
  // (the seats: themed controls, navy by night, not cream slabs)
  expect(await low(page), 'setup').toEqual([]);
  await sh.locator('[data-sg-start]')[how]();
  await expect(sh).toHaveAttribute('data-level', 'play');
  expect(await low(page), 'play').toEqual([]);
  await sh.locator('[data-sg-menu]')[how]();
  await sh.locator('dialog[open] [data-sg-end]')[how]();
  await sh.locator('[data-sg-end-yes]')[how]();
  await expect(sh).toHaveAttribute('data-level', 'results');
  expect(await low(page), 'results').toEqual([]);
});

test('the board’s cream pager keeps the day’s sunk ‹ › at night (not night’s navy on cream)', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await island(page);
  await tapBoard(page, { mouse: how === 'click' });
  const view = page.getByRole('dialog', { name: 'けいじばん' });
  await expect(view).toBeVisible({ timeout: 10_000 });
  const older = view.locator('[data-board-older]');
  await expect(older).toHaveAttribute('aria-disabled', 'true');
  expect(await older.evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(234, 215, 172)');
  expect(await low(page)).toEqual([]);
});

test('a trail’s credits read at night (their links the night’s green on the navy sheet)', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await island(page);
  await fromMenu(page, 'hiking', how);
  await page.locator('dialog[open] [data-trail="akagi-kurobi"]')[how]();
  const view = page.locator('dialog[open] [data-trail-view="akagi-kurobi"]');
  await view.locator('[data-sheet-grip]')[how]();
  await expect(view).toHaveAttribute('data-sheet', 'full');
  await view.locator('.body').evaluate((b) => (b.scrollTop = b.scrollHeight));
  await expect(view.locator('[data-photo-credit] a').first()).toBeInViewport();
  expect(await low(page)).toEqual([]);
});

test('a trail’s chart and plan read at night (the elevation line, the start/goal dots: the night’s coral/green on the navy card)', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await island(page);
  await fromMenu(page, 'hiking', how);
  await page.locator('dialog[open] [data-trail="kinpu-odarumi"]')[how]();
  const view = page.locator('dialog[open] [data-trail-view="kinpu-odarumi"]');
  await view.locator('[data-sheet-grip]')[how]();
  await expect(view).toHaveAttribute('data-sheet', 'full');
  // (not text, so outside low(): each mark's colour on its card)
  const ratio = (sel: string, prop: 'stroke' | 'backgroundColor') => view.locator(sel).first().evaluate((el, prop) => {
    const lum = (s: string) => {
      const [r, g, b] = s.match(/[\d.]+/g)!.slice(0, 3).map((x) => +x / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const [a, b] = [lum(getComputedStyle(el)[prop]), lum(getComputedStyle(el.closest('.card')!).backgroundColor)];
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }, prop);
  expect(await ratio('[data-elev] .line', 'stroke')).toBeGreaterThan(3);
  for (const end of ['.start .dot', '.goal .dot']) expect(await ratio(end, 'backgroundColor'), end).toBeGreaterThan(3);
  expect(await low(page)).toEqual([]);
});

test('a trip’s 日程 reads at night: the day number and the row on now in the day’s colour, mixed light', async ({ page }, info) => {
  const how = howOf(info.project.name);
  // Feb 12, 19:30 in Tokyo (night) = 23:30 in Auckland: NZ's day 2, the pill opens into it
  await page.goto('?demo&date=2027-02-12T19:30');
  await islandUp(page);
  await fromMenu(page, 'travel', how);
  const day = page.locator('dialog[open] [data-trip-view="nz"] [data-day="2"]');
  await expect(day.locator('[data-now]')).toHaveCount(1);
  await day.locator('[data-now]').scrollIntoViewIfNeeded();
  expect(await low(page)).toEqual([]);
  await day.locator('.dn').scrollIntoViewIfNeeded();
  expect(await low(page)).toEqual([]);
});

test('English Study at night: the week’s 達成 and an answered choice’s ○ (the night’s leaf text on navy)', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await fakeYoutube(page);
  // three days studied this week (Mon–Wed; the night is Wednesday's): 今週の3日、達成
  await page.addInitScript(() => {
    if (localStorage.getItem('island-demo.events')) return;
    const ev = (d: string, i: number) => {
      const at = Date.parse(`${d}T20:00:00+09:00`);
      return { id: `seed-listen-${i}`, type: 'listen', data: { d, g: `nightseed${i}`, gm: 'tv', u: 'waitress', lv: 7, n: 1, ms: 60000, f: 1, r: [] }, queuedAt: at, tries: 0, nextAt: 0, ackedAt: at, person: 'A' };
    };
    localStorage.setItem('island-demo.events', JSON.stringify({ day: '2026-11-04', events: ['2026-11-02', '2026-11-03', '2026-11-04'].map(ev) }));
  });
  await island(page);
  await fromMenu(page, 'english', how);
  const sh = page.locator('dialog[open] [data-english]');
  await expect(sh.locator('[data-en-met]')).toBeVisible();
  expect(await low(page), 'home').toEqual([]);
  // the day's clip: question 1, picked till it's answered (a second miss shows it): ○ on the answer
  await sh.locator('[data-en-today] [data-en-start]')[how]();
  await sh.locator('[data-en-lesson] [data-en-to-q]')[how]();
  const card = sh.locator('[data-en-lesson] [data-en-q="0"]');
  await card.locator('[data-choice="0"]')[how]();
  await expect(card.locator('[data-en-nudge], [data-ans]').first()).toBeVisible();
  if (!(await card.locator('[data-ans]').count())) await card.locator('[data-choice="1"]')[how]();
  await expect(card.locator('[data-ans]')).toBeVisible();
  expect(await low(page), 'answered').toEqual([]);
  // the ○ is a ::before (not a text node, so the walk above can't see it): the night's leaf text, not the day's
  const mark = await card.locator('[data-ans] .prl').evaluate((el) => getComputedStyle(el, '::before').color);
  expect(mark).toBe('rgb(158, 230, 166)'); // --leaf-text at night (#9EE6A6, 5.8:1 on navy)
});

test('English Study’s unavailable note at night: an always-tan object (.obj-cream), the day’s ink', async ({ page }, info) => {
  const how = howOf(info.project.name);
  await fakeYoutube(page, { error: 150 });
  await island(page);
  await fromMenu(page, 'english', how);
  const sh = page.locator('dialog[open] [data-english]');
  await sh.locator('[data-en-today] [data-en-start]')[how]();
  await expect(sh.locator('[data-yt-unavailable]')).toBeVisible();
  expect(await low(page)).toEqual([]);
});
