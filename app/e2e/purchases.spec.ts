// ごほうびの きろく (at the very bottom of ごほうび, the panel; the old /jar link opens it): the buys, folded under a
// disclosure, newest first, each erasable by either of us (asked first, キャンセル / 削除); the ベル go back. On `?demo` (no backend, no key). Screenshots at 375x667 and 390x844 (test-results/purchases-*.png).
import { expect, test, type Page } from './fixtures.ts';

/** The topmost sheet (a confirm over the panel). */
const sheet = (page: Page) => page.locator('dialog[open]').last();
const balance = async (page: Page) => Number((await page.locator('.hero .total').innerText()).replace(/\D/g, ''));
/** The buys, unfolded (folded on every opening of the panel). */
async function history(page: Page) {
  const hist = page.locator('.hist');
  const toggle = hist.locator('[data-hist-toggle]');
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  // the grow (280 ms) done
  await expect.poll(() => hist.locator('.fold').evaluate((el) => el.getAnimations().length)).toBe(0);
  return hist;
}

/** Every control of the history (rows' ✕, もっと見る) sits clear of the others and inside the screen. */
async function noOverlap(page: Page) {
  const boxes = await page.locator('.hist button, .hist li').evaluateAll((els) => els.map((e) => {
    const r = e.getBoundingClientRect();
    return { tag: e.tagName, l: r.left, r: r.right, t: r.top, b: r.bottom };
  }));
  const vw = page.viewportSize()!.width;
  for (const x of boxes) expect(x.l >= 0 && x.r <= vw, JSON.stringify(x)).toBe(true);
  const btns = boxes.filter((x) => x.tag === 'BUTTON');
  for (let i = 0; i < btns.length; i++) for (let j = i + 1; j < btns.length; j++) {
    const a = btns[i], b = btns[j];
    expect(a.r <= b.l || b.r <= a.l || a.b <= b.t || b.b <= a.t, `${JSON.stringify(a)} ${JSON.stringify(b)}`).toBe(true);
  }
  // each row's parts stay apart: the icon, the label, the price and ✕
  const rows = await page.locator('.hist li').evaluateAll((lis) => lis.map((li) =>
    [...li.children].map((c) => { const r = c.getBoundingClientRect(); return [r.left, r.right]; })));
  for (const parts of rows) for (let i = 1; i < parts.length; i++) expect(parts[i][0]).toBeGreaterThanOrEqual(parts[i - 1][1] - 0.5);
}

test('buy → it heads the history → erase it (削除) → the ベル come back; キャンセル keeps it', async ({ page }) => {
  await page.goto('jar?demo');
  await expect(page.locator('.hist').getByRole('heading', { name: /^買い物の記録\s*\d+件$/ })).toBeVisible();
  const hist = await history(page);
  const before = await balance(page);
  const rowsBefore = await hist.locator('li').count();

  await page.locator('.shop button[data-item="snack"]').click();
  await sheet(page).getByRole('button', { name: '買う！' }).click();
  await expect.poll(() => balance(page)).toBe(before - 40);
  // the newest buy first: today, the reward, who bought it, the price
  const first = hist.locator('li').first();
  await expect(first).toContainText('おやつ');
  await expect(first).toContainText(/−40\sベル/);
  await expect(hist.locator('li')).toHaveCount(Math.min(rowsBefore + 1, 10));

  // キャンセル: nothing changes
  await first.getByRole('button', { name: /おやつの買い物を削除/ }).click();
  await expect(sheet(page)).toContainText('この買い物を削除しますか？');
  await expect(sheet(page)).toContainText(/40\sベルが戻ります/);
  await sheet(page).getByRole('button', { name: 'キャンセル' }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(1); // the panel stays
  await expect.poll(() => balance(page)).toBe(before - 40);

  // 削除: the line goes and the ベル come back (with とりけす on the banner)
  const id = await first.getAttribute('data-spend');
  await first.getByRole('button', { name: /おやつの買い物を削除/ }).click();
  await sheet(page).getByRole('button', { name: '削除', exact: true }).click();
  await expect.poll(() => balance(page)).toBe(before);
  await expect(hist.locator(`li[data-spend="${id}"]`)).toHaveCount(0);
  await expect(page.getByText(/おやつを削除しました \+40\sベル/)).toBeVisible();
  // とりけす on the banner brings the buy back
  await page.getByRole('button', { name: '取り消す' }).click();
  await expect.poll(() => balance(page)).toBe(before - 40);
  await expect(hist.locator(`li[data-spend="${id}"]`)).toHaveCount(1);
});

test('either of us can erase any buy, the partner\'s too', async ({ page }) => {
  await page.goto('jar?demo');
  const hist = await history(page);
  await expect(hist.locator('li').first()).toBeVisible();
  const names = await hist.locator('li .who').allTextContents();
  expect(new Set(names.map((n) => n.trim())).size, names.join(',')).toBe(2); // the demo has buys by both of us
  const before = await balance(page);
  const row = hist.locator('li').filter({ hasText: names.find((n) => n !== names[0])! }).first();
  const price = Number((await row.locator('.amt').innerText()).replace(/\D/g, ''));
  await row.locator('button.x').click();
  await sheet(page).getByRole('button', { name: '削除', exact: true }).click();
  await expect.poll(() => balance(page)).toBe(before + price);
});

for (const vp of [{ width: 375, height: 667 }, { width: 390, height: 844 }]) {
  test(`history at ${vp.width}x${vp.height}: ten rows, もっと見る, nothing overlaps`, async ({ page }) => {
    await page.setViewportSize(vp);
    await page.goto('jar?demo&weeks=20'); // more than ten buys (the default 8 weeks have fewer at 40 / 70)
    const hist = await history(page);
    await expect(hist.locator('li')).toHaveCount(10);
    await noOverlap(page);
    await hist.scrollIntoViewIfNeeded();
    if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/purchases-${vp.width}x${vp.height}.png`, fullPage: true });
    const more = hist.getByRole('button', { name: 'もっと見る' });
    await more.click();
    expect(await hist.locator('li').count()).toBeGreaterThan(10);
    await noOverlap(page);
    await hist.locator('li').first().locator('button.x').click();
    await expect(sheet(page).getByRole('button', { name: '削除', exact: true })).toBeVisible();
    if (process.env.SHOTS) await page.waitForTimeout(800); // the sheet's slide-in, for the screenshot
    if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/purchases-confirm-${vp.width}x${vp.height}.png` });
  });
}
