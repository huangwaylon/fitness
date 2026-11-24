// The bare pages (ui-state/paths.ts isBare: ジム's /gym, 共有リンク's /s) on a stranger's phone: the root layout runs bare
// (routes/+layout.svelte: no app shell, routes/AppShell.svelte, so no week, world, sound nor log), the page names itself
// (LINE's browser shows the title), its theme-color is the paper's (the island's sky is the island's), and /gym draws
// with its own Zen Maru Gothic subset (styles/fonts-gym.css), never the app's kana and 常用 files. The Worker and the
// relay are routed (e2e/gymbot.ts, e2e/share.ts), never fetched.
import { expect, test, type Page } from './fixtures.ts';
import { pinnedClock } from './fixtures.ts';
import { fakeGym, routeGym } from './gymbot.ts';
import { routeShare, TOKEN } from './share.ts';

test.use({ storageState: { cookies: [], origins: [] } });

/** The files the page asked for, by name. */
const asked = (page: Page) => {
  const files: string[] = [];
  page.on('request', (r) => void files.push(new URL(r.url()).pathname.split('/').pop()!));
  return files;
};
const paper = (page: Page) => expect.poll(() => page.evaluate(() => [...document.querySelectorAll('meta[name="theme-color"]')].map((m) => m.getAttribute('content')))).toEqual(['#FFF9E3']);

test('/gym: its own title and the paper\'s theme-color, its own font files, no app shell', async ({ page, context }) => {
  const clock = pinnedClock();
  await clock.device(context);
  const gym = fakeGym(clock.now);
  await routeGym(page, gym, clock.now);
  const files = asked(page);
  await page.goto(`gym#${'5e'.repeat(32)}`);
  await expect(page.locator('[data-gym-link="page"] [data-gym-day]')).toHaveCount(25);
  await expect(page).toHaveTitle('ジム');
  await paper(page);
  await page.evaluate(() => document.fonts.ready);
  const fonts = files.filter((f) => f.endsWith('.woff2'));
  expect(fonts.some((f) => /^zen-maru-gothic-700-gym\./.test(f))).toBe(true);
  expect(fonts.filter((f) => /^zen-maru-gothic-[57]00-(kana|joyo|extra)\./.test(f))).toEqual([]);
  expect(files.filter((f) => /^AppShell\./.test(f) || f.endsWith('.glb'))).toEqual([]);
  // the page in its own family, the app's next (tokens.css --font-zmg)
  expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toMatch(/^"?Zen Maru Gothic Gym"?, "?Zen Maru Gothic"?,/);
});

test('/s: its own title and the paper\'s theme-color, no app shell', async ({ page }) => {
  await routeShare(page, () => ({ ok: true, kind: 'trip', ref: 'nz', exp: '2027-11-20T03:00:00.000Z', data: {} }));
  const files = asked(page);
  await page.goto(`s#${TOKEN}`);
  await expect(page.locator('[data-share-trip="nz"]')).toBeVisible();
  await expect(page).toHaveTitle(/ニュージーランド · 旅のしおり/);
  await paper(page);
  expect(files.filter((f) => /^AppShell\./.test(f))).toEqual([]);
});
