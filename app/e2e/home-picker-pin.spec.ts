// いえを かえる's preview stays pinned under the title bar while the choices scroll (the user, 2026-11-10): scrolled to the
// doors, the preview hasn't moved, and a choice made down there shows in it at once.
import { expect, test } from './fixtures.ts';
import { roomUp } from './rooms.ts';

test.use({ viewport: { width: 393, height: 852 } });

test('the house preview stays in view as the choices scroll, and a choice made scrolled down shows in it', async ({ page }) => {
  await page.goto('tent/?demo&date=2026-11-04T12:00&as=B&home=B');
  await roomUp(page, 'tent');
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

// the swatches and NH's icons are cells of one atlas (homes-picker.json, scripts/home-models.ts): one request on open,
// every cell drawn from it at its own place
test('the picker draws every swatch and icon from its one atlas', async ({ page }) => {
  const asked: string[] = [];
  page.on('request', (r) => {
    if (r.url().includes('/room/homes/') && r.url().endsWith('.webp')) asked.push(new URL(r.url()).pathname.split('/').pop()!);
  });
  await page.goto('tent/?demo&date=2026-11-04T12:00&as=B&home=B&preview=0');
  await roomUp(page, 'tent');
  await page.locator('[data-home-look]').click();
  const pick = page.locator('[data-home-picker]');
  await expect(pick.locator('[data-wall]').first()).toBeVisible();
  const cells = await pick.locator('.sw, .ico').evaluateAll((els) => els.map((e) => ({ img: getComputedStyle(e).backgroundImage, at: getComputedStyle(e).backgroundPosition })));
  // the player house's walls and roofs in their colours, their icons, the doors' icons, the chosen door's colours
  expect(cells.length).toBeGreaterThan(60);
  for (const c of cells) expect(c.img).toMatch(/\/room\/homes\/picker\.[0-9a-f]{8}\.webp"?\)$/);
  expect(new Set(cells.map((c) => c.at)).size).toBe(cells.length);
  // (the atlas itself loads: a real image the size its index says)
  const url = /url\("?([^")]+)"?\)/.exec(cells[0].img)![1], file = url.split('/').pop()!;
  const size = await page.evaluate((src) => new Promise<number[]>((ok) => {
    const im = new Image();
    im.onload = () => ok([im.naturalWidth, im.naturalHeight]);
    im.onerror = () => ok([0, 0]);
    im.src = src;
  }), url);
  expect(size).toEqual([1152, 1284]);
  // another shape's materials: the same atlas, nothing else asked for
  await page.locator('[data-shape="NC"]').click();
  await expect(pick.locator('[data-wall]').first()).toBeVisible();
  expect([...new Set(asked)]).toEqual([file]);
});
