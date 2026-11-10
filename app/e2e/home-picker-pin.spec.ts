// いえを かえる's preview stays pinned under the title bar while the choices scroll (the user, 2026-11-10): scrolled to the
// doors, the preview hasn't moved, and a choice made down there shows in it at once.
import { expect, test } from './fixtures.ts';

test.use({ viewport: { width: 393, height: 852 } });

test('the house preview stays in view as the choices scroll, and a choice made scrolled down shows in it', async ({ page }) => {
  await page.goto('tent/?demo&date=2026-11-04T12:00&as=B&home=B');
  await page.waitForFunction(() => ((window as unknown as { __tent?: { stats(): { frames: number } } }).__tent?.stats()?.frames ?? 0) > 0);
  await page.locator('[data-home-look]').click();
  const preview = page.locator('[data-home-preview]');
  await expect(preview).toHaveAttribute('data-shown', /^house /);
  const sheet = page.locator('dialog[open]:has([data-home-picker])');
  // (the sheet up: its slide in over)
  await sheet.evaluate((d) => Promise.all(d.getAnimations().map((a) => a.finished)));
  const top = await preview.boundingBox();
  const shown = await preview.getAttribute('data-shown');
  // to the bottom of the list: the doors
  await sheet.evaluate((d) => (d.scrollTop = d.scrollHeight));
  await expect.poll(() => sheet.evaluate((d) => d.scrollTop)).toBeGreaterThan(300);
  expect(await preview.boundingBox()).toEqual(top);
  await expect(preview).toBeInViewport({ ratio: 1 });
  // a door chosen down there: the preview's house has it
  const door = page.locator('[data-door]:not([aria-pressed="true"])').last();
  const style = await door.getAttribute('data-door');
  await door.click();
  await expect(preview).toHaveAttribute('data-shown', new RegExp(` ${style}\\.`));
  expect(await preview.getAttribute('data-shown')).not.toBe(shown);
  expect(await preview.boundingBox()).toEqual(top);
});
