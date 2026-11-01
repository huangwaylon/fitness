// Back to 島 from ごほうび never opens the island panel by itself (user, iPhone: "clicking back to island causes the
// kyou pop up to pop up"). The museum's ask for the ずかん stood (a counter the HUD read on mount), so every return from
// ごほうび after a museum visit, the HUD remounting, opened しまの てちょう. Also: no tap falls through to the HUD
// target under the finger, with real touch taps (the back pill sits over the ribbon on a phone with a notch) and a
// pointerdown → pointerup → click sequence, nor from the panel's ✕.
import { expect, test, type Page } from '@playwright/test';

const ribbon = (page: Page) => page.getByRole('button', { name: /^きょう [\d,]+\sベル$/ });
const museum = (page: Page) => page.getByRole('button', { name: 'はくぶつかん：ずかんを ひらく' });
const panel = (page: Page) => page.locator('dialog[open]');
const center = async (page: Page, sel: string) => {
  const b = (await page.locator(sel).boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};
/** A notch's safe area, as on an iPhone 13 (the back pill then sits over the ribbon). */
const notch = (page: Page) => page.addInitScript(() => addEventListener('DOMContentLoaded', () => {
  const s = document.createElement('style');
  s.textContent = 'html:root { --safe-top: 47px !important; }';
  document.head.append(s);
}));

/** A touch on (x, y) as the phone sends it: pointerdown, pointerup, then the click, on what's under the finger. */
async function pointerTap(page: Page, x: number, y: number) {
  await page.evaluate(({ x, y }) => {
    const o = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y, pointerType: 'touch', isPrimary: true, pointerId: 7 };
    const at = () => document.elementFromPoint(x, y)!;
    at().dispatchEvent(new PointerEvent('pointerdown', o));
    at().dispatchEvent(new PointerEvent('pointerup', o));
    (at() as HTMLElement).click();
  }, { x, y });
}

/** 島 → ごほうび (the HUD jar) → 島 (‹ 島へ), each a tap; then the panel stays shut. */
async function roundTrip(page: Page, tap: (x: number, y: number) => Promise<void>) {
  const j = await center(page, '.hud-jar');
  await tap(j.x, j.y);
  await expect(page.locator('.jar-screen .nav.back')).toBeVisible();
  await page.waitForTimeout(500); // the zoom in
  const b = await center(page, '.jar-screen .nav.back');
  await tap(b.x, b.y);
  await expect(ribbon(page)).toBeVisible();
  await page.waitForTimeout(900); // the zoom out, and any late tap
  await expect(panel(page)).toHaveCount(0);
  await expect(ribbon(page)).toHaveAttribute('aria-expanded', 'false');
}

test('after the museum opened the ずかん, back from ごほうび leaves the panel shut (touch taps)', async ({ page }) => {
  await notch(page);
  await page.goto('?demo&date=2026-11-04T12:00');
  await expect(ribbon(page)).toBeVisible();
  // the museum stands at おく: the camera there first
  await page.waitForFunction(() => (window as unknown as { __world?: unknown }).__world);
  await page.evaluate(() => (window as unknown as { __world: { go: (z: number) => void } }).__world.go(1380));
  await page.waitForTimeout(400);
  await museum(page).click();
  const box = page.locator('[data-fx="talk"]');
  await box.click(); // finish the page
  await box.click(); // close it: the ずかん opens
  await expect(panel(page)).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(panel(page)).toHaveCount(0);
  await page.waitForTimeout(600);
  await roundTrip(page, (x, y) => page.touchscreen.tap(x, y));
  await roundTrip(page, (x, y) => pointerTap(page, x, y));
  // the ribbon still opens it, on the tab it had (きろく's top, not the ずかん asked for earlier)
  await ribbon(page).click();
  await expect(panel(page)).toHaveCount(1);
  await expect(page.locator('dialog[open] [data-sec="zukan"]')).not.toBeInViewport();
});

test('no tap falls through to the HUD: ‹ 島へ over the ribbon, and the panel ✕', async ({ page }) => {
  await notch(page);
  await page.goto('?demo&date=2026-11-04T12:00');
  await expect(ribbon(page)).toBeVisible();
  await roundTrip(page, (x, y) => page.touchscreen.tap(x, y));
  await roundTrip(page, (x, y) => pointerTap(page, x, y));
  // the panel's ✕, then nothing under it acts (no reopen, no trip to ごほうび)
  await ribbon(page).click();
  await expect(panel(page)).toHaveCount(1);
  await page.waitForTimeout(500);
  const x = await center(page, 'dialog[open] .nav.close');
  await page.touchscreen.tap(x.x, x.y);
  await expect(panel(page)).toHaveCount(0);
  await page.waitForTimeout(600);
  await expect(panel(page)).toHaveCount(0);
  await expect(page).not.toHaveURL(/\/jar/);
});
