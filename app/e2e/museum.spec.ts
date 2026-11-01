// The museum (docs/design.md "Museum"): NH's museum at the back of the island, the door to the ずかん. A tap and
// Blathers says a line in NH's dialogue box (drowsy by day, lively at night, about the latest find when there's a recent
// one); when the box closes the panel opens on きろく's ずかん. No ベル, nothing written.
import { expect, test, type Page } from '@playwright/test';
import ja from '../src/lib/i18n/ja.json' with { type: 'json' };

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
const museum = (page: Page) => page.getByRole('button', { name: 'はくぶつかん：ずかんを ひらく' });
const lines = (mood: 'day' | 'night') => [0, 1, 2].map((i) => (ja as Record<string, string>)[`museum.${mood}.${i}`]);

/** The camera to world z (おく 1380: the museum; ひろば 860: the pond). */
async function go(page: Page, z: number) {
  await page.evaluate((z) => (window as unknown as { __world: { go(z: number): void } }).__world.go(z), z);
  await page.waitForTimeout(300);
}

async function open(page: Page, q: string, cam = 1380) {
  await page.addInitScript(() => ((window as { __cues?: string[] }).__cues = []));
  await page.goto(`?demo${q}`);
  await expect(ribbon(page)).toBeVisible();
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.waitForTimeout(500);
  await go(page, cam);
}

for (const vp of [{ width: 375, height: 667 }, { width: 390, height: 844 }]) {
  test(`the museum at ${vp.width}: on the island, a 44px button clear of the other controls`, async ({ page }) => {
    await page.setViewportSize(vp);
    await open(page, '&date=2026-11-04T12:00');
    const b = (await museum(page).boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(44);
    expect(b.height).toBeGreaterThanOrEqual(44);
    // its middle is its own (no other control over it)
    const top = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.closest('button')?.getAttribute('aria-label'), { x: b.x + b.width / 2, y: b.y + b.height * 0.6 });
    expect(top).toBe('はくぶつかん：ずかんを ひらく');
  });
}

test('by day Blathers is drowsy; tapping his box away opens the ずかん in きろく', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await open(page, '&date=2026-11-04T12:00');
  await museum(page).click();
  const box = page.locator('[data-fx="talk"]');
  await expect(box).toContainText('フータ');
  const text = (await box.getAttribute('aria-label'))!.replace(/^フータ: /, '');
  expect(lines('day')).toContain(text);
  expect(await page.evaluate(() => (window as { __cues?: string[] }).__cues)).toContain('scene-museum');
  await expect(page.locator('dialog[open]')).toHaveCount(0); // not yet: he's talking
  await box.click(); // finish the page
  await box.click(); // close it
  await expect(page.locator('dialog[open]')).toHaveCount(1);
  await expect(page.locator('dialog[open] .tab[data-tab=kiroku]')).toHaveAttribute('aria-pressed', 'true');
  const head = page.locator('dialog[open] [data-sec="zukan"]');
  await expect(head).toBeInViewport();
  await expect(page.locator('[data-zukan="fish"]')).toBeVisible();
});

test('at night he is lively and mentions the latest find; left alone the box closes and the ずかん opens', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  // a carp caught just now (the demo's own store)
  await open(page, '&date=2026-11-04T21:00&critter=carp', 860);
  await expect(page.locator('[data-critter="pond"]')).toBeAttached();
  await page.waitForTimeout(600);
  const f = await page.locator('[data-critter="pond"]').evaluate((el) => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top }; });
  await page.mouse.click(f.x + 6, f.y);
  await expect(page.locator('[data-bite]')).toBeAttached({ timeout: 10_000 });
  await page.waitForTimeout(400);
  await page.mouse.click(f.x, f.y);
  // tap the plate away (the line, then the ずかん's page)
  const plate = page.locator('[data-fx="catch"].placed .catch-plate');
  await expect(plate).toBeVisible();
  for (let i = 0; i < 6 && (await page.locator('[data-fx="catch"]').count()); i++) await plate.click().catch(() => {});
  await expect(page.locator('[data-fx="catch"]')).toHaveCount(0);
  await go(page, 1380);
  // three in five he talks about it: tap until he does (a greeting otherwise, also lively)
  const night = lines('night');
  let mentioned = false;
  for (let i = 0; i < 12 && !mentioned; i++) {
    await page.keyboard.press('Escape');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await museum(page).click();
    const label = (await page.locator('[data-fx="talk"]').getAttribute('aria-label'))!.replace(/^フータ: /, '');
    mentioned = label === 'ホー！ さいきん コイを 見つけたそうですな！';
    if (!mentioned) expect(night).toContain(label);
    await expect(page.locator('dialog[open]')).toHaveCount(1, { timeout: 8000 }); // read through: it opens by itself
  }
  expect(mentioned).toBe(true);
});
