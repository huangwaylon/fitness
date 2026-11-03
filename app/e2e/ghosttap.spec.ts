// Closing a sheet over the HUD never opens another by itself (user, iPhone: "clicking back to island causes the kyou
// pop up to pop up": once the return from the old ごほうび page). No tap falls through to the HUD target under the
// finger, with real touch taps (on a phone with a notch the ✕ sits near the HUD) and a pointerdown → pointerup →
// click sequence, from the health popup's ✕ nor from the panel's.
import { expect, test, type Page } from '@playwright/test';

const hudJar = (page: Page) => page.getByRole('button', { name: /^ごほうび · ふたりのベル / });
const panel = (page: Page) => page.locator('dialog[open]');
const center = async (page: Page, sel: string) => {
  const b = (await page.locator(sel).boundingBox())!;
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
};
/** A notch's safe area, as on an iPhone 13 (the back pill then sits over the HUD row). */
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
    at().dispatchEvent(new MouseEvent('click', o)); // (an SVG under the finger has no .click(): the event bubbles to its button)
  }, { x, y });
}

/** 島 → けんこう (the HUD's dumbbell) → its ✕, each a tap; then nothing opens again (no panel, no popup). */
async function roundTrip(page: Page, tap: (x: number, y: number) => Promise<void>) {
  const j = await center(page, '.hud-health');
  await tap(j.x, j.y);
  await expect(page.locator('dialog[open] [data-health-sheet]')).toBeVisible();
  await page.waitForTimeout(500); // the zoom in
  const b = await center(page, 'dialog[open] .nav.close');
  await tap(b.x, b.y);
  await expect(panel(page)).toHaveCount(0);
  await page.waitForTimeout(900); // any late tap
  await expect(panel(page)).toHaveCount(0);
  await expect(hudJar(page)).toHaveAttribute('aria-expanded', 'false');
}

test('no tap falls through to the HUD: the health popup’s ✕, and the panel’s', async ({ page }) => {
  await notch(page);
  await page.goto('?demo&date=2026-11-04T12:00');
  await expect(hudJar(page)).toBeVisible();
  await roundTrip(page, (x, y) => page.touchscreen.tap(x, y));
  await roundTrip(page, (x, y) => pointerTap(page, x, y));
  // the panel's ✕, then nothing under it acts (no reopen, no health popup)
  await hudJar(page).click();
  await expect(panel(page)).toHaveCount(1);
  await page.waitForTimeout(500);
  const x = await center(page, 'dialog[open] .nav.close');
  await page.touchscreen.tap(x.x, x.y);
  await expect(panel(page)).toHaveCount(0);
  await page.waitForTimeout(600);
  await expect(panel(page)).toHaveCount(0);
});
